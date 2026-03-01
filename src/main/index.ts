import { app, BrowserWindow, Menu } from "electron";
import {
    installExtension,
    REDUX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { is } from "@electron-toolkit/utils";

import {
    registerCoreIpcHandlers,
    registerEarlyIpcHandlers,
    registerWindowIpcHandlers,
} from "./bootstrap/ipcRegistration";
import {
    registerProcessErrorHandlers,
    registerShutdownHandlers,
} from "./bootstrap/lifecycle";
import {
    buildCliHelpPayload,
    renderCliHelp,
    resolveCliHelpRequest,
} from "./bootstrap/cliHelp";
import {
    buildSceneTemplate,
    renderSceneTemplate,
    resolveCliSceneTemplateRequest,
} from "./bootstrap/cliSceneTemplate";
import {
    renderSceneValidationText,
    resolveCliValidateSceneRequest,
    validateSceneFromPath,
} from "./bootstrap/cliValidateScene";
import {
    CLI_EXIT_CODES,
    createCliErrorResult,
    createCliSuccessResult,
    stringifyCliJsonResult,
} from "./bootstrap/cliResult";
import {
    awaitControlCommandResult,
    createControlCommandResultRequest,
    writeControlCommandResultToProcess,
} from "./bootstrap/controlCommandResult";
import {
    reportStartupLaunchParseError,
    writeCliInvalidArgumentError,
    writeCliSceneValidationError,
} from "./bootstrap/cliErrorHandler";
import { normalizeArgv } from "./bootstrap/cliArgs";
import { resolveCliRuntimeOptions } from "./bootstrap/cliRuntimeOptions";
import { resolveCliSubcommandArgv } from "./bootstrap/cliSubcommand";
import {
    acquireSingleInstanceLock,
    registerSingleInstanceHandlers,
} from "./bootstrap/singleInstance";
import { resolveStartupCliRoute } from "./bootstrap/cliRouter";
import { resolveSecondInstanceCommand } from "./bootstrap/secondInstanceCommand";
import { type StartupWindowOptions } from "./bootstrap/startupLaunch";
import {
    registerLocalResourceProtocol,
    setupProtocolHandler,
} from "./ipc/protocol";
import { initializeMainI18n } from "../i18n/mainI18n";
import log, { setLogLevel, LevelOption } from "./logger";
import { ProjectRepositoryFactory } from "./repositories/ProjectRepositoryFactory";
import { SettingsRepositoryFactory } from "./repositories/SettingsRepositoryFactory";
import { WindowRepositoryFactory } from "./repositories/WindowRepositoryFactory";
import { WindowManager } from "./windows/windowManager";
import { cleanupClipboardCache } from "./services/clipboardCacheService";

let cliHelpRequest: ReturnType<typeof resolveCliHelpRequest> = null;
let cliSceneTemplateRequest: ReturnType<typeof resolveCliSceneTemplateRequest> =
    null;
let cliValidateSceneRequest: ReturnType<typeof resolveCliValidateSceneRequest> =
    null;
const cliRuntimeOptions = resolveCliRuntimeOptions(
    process.argv,
    app.isPackaged
);
try {
    cliHelpRequest = resolveCliHelpRequest(process.argv, app.isPackaged);
    if (!cliHelpRequest) {
        cliSceneTemplateRequest = resolveCliSceneTemplateRequest(
            process.argv,
            app.isPackaged
        );
    }
    if (!cliHelpRequest && !cliSceneTemplateRequest) {
        cliValidateSceneRequest = resolveCliValidateSceneRequest(
            process.argv,
            app.isPackaged
        );
    }
} catch (error) {
    writeCliInvalidArgumentError(error);
    process.exit(CLI_EXIT_CODES.INVALID_ARGUMENT);
}

if (cliHelpRequest) {
    if (cliHelpRequest.format === "json") {
        process.stdout.write(
            `${stringifyCliJsonResult(
                createCliSuccessResult({
                    code: "CLI_HELP",
                    message: "CLI help output.",
                    data: buildCliHelpPayload(cliHelpRequest.topic),
                })
            )}\n`
        );
    } else {
        process.stdout.write(`${renderCliHelp(cliHelpRequest)}\n`);
    }
    process.exit(CLI_EXIT_CODES.SUCCESS);
}

if (cliSceneTemplateRequest) {
    if (cliSceneTemplateRequest.format === "json") {
        process.stdout.write(
            `${stringifyCliJsonResult(
                createCliSuccessResult({
                    code: "CLI_SCENE_TEMPLATE",
                    message: "Scene template generated.",
                    data: buildSceneTemplate(cliSceneTemplateRequest.version),
                })
            )}\n`
        );
    } else {
        process.stdout.write(
            `${renderSceneTemplate(cliSceneTemplateRequest)}\n`
        );
    }
    process.exit(CLI_EXIT_CODES.SUCCESS);
}

if (cliValidateSceneRequest) {
    try {
        const result = validateSceneFromPath(cliValidateSceneRequest.scenePath);
        if (cliValidateSceneRequest.format === "json") {
            process.stdout.write(
                `${stringifyCliJsonResult(
                    createCliSuccessResult({
                        code: "CLI_SCENE_VALIDATION_OK",
                        message: "Scene validation succeeded.",
                        warnings: result.warnings,
                        data: {
                            scenePath: result.scenePath,
                            version: result.resolvedScene.version,
                            imageCount: result.resolvedScene.images.length,
                            dimensionLineCount:
                                result.resolvedScene.dimensionLines?.length ??
                                0,
                        },
                    })
                )}\n`
            );
        } else {
            process.stdout.write(`${renderSceneValidationText(result)}\n`);
        }
        process.exit(CLI_EXIT_CODES.SUCCESS);
    } catch (error) {
        writeCliSceneValidationError(
            cliValidateSceneRequest.scenePath,
            cliValidateSceneRequest.format,
            error
        );
        process.exit(CLI_EXIT_CODES.VALIDATION_FAILED);
    }
}

let preflightSecondInstanceCommand: ReturnType<
    typeof resolveSecondInstanceCommand
> = null;
const hasExplicitControlSubcommand =
    resolveCliSubcommandArgv(normalizeArgv(process.argv, app.isPackaged))
        .subcommand === "control";
try {
    preflightSecondInstanceCommand = resolveSecondInstanceCommand(
        process.argv,
        app.isPackaged,
        process.cwd()
    );
} catch (error) {
    writeCliInvalidArgumentError(error);
    process.exit(CLI_EXIT_CODES.INVALID_ARGUMENT);
}

const controlResultRequest =
    hasExplicitControlSubcommand || preflightSecondInstanceCommand
        ? createControlCommandResultRequest()
        : undefined;

// 永続化レイヤーを先に構築して、以降は依存注入で扱う
const settingsRepository = SettingsRepositoryFactory.create();
const windowRepository = WindowRepositoryFactory.create();
const projectRepository = ProjectRepositoryFactory.create();

// WindowManager はウィンドウ生成・ファイルオープン・ショートカットを一元管理する
const windowManager = new WindowManager(windowRepository);

// ネイティブメニューは使わない
Menu.setApplicationMenu(null);

// 起動初期化: 例外監視/IPC/プロトコルを先に準備
registerEarlyIpcHandlers();
registerProcessErrorHandlers();
registerLocalResourceProtocol();

const gotTheLock = controlResultRequest
    ? acquireSingleInstanceLock(
          controlResultRequest,
          preflightSecondInstanceCommand ?? undefined
      )
    : acquireSingleInstanceLock();
log.info("Application starting...");

if (!gotTheLock) {
    if (controlResultRequest) {
        // プライマリインスタンス側の処理時間に合わせたタイムアウトを算出する。
        // --wait-stable --timeout-ms のような長時間待機コマンドでは、
        // コマンド自体の timeoutMs + 5秒のバッファを設定して
        // プライマリ側が応答を書き込むまで十分待つ。
        const CONTROL_RESULT_BUFFER_MS = 5000;
        const controlResultTimeoutMs =
            preflightSecondInstanceCommand?.kind === "wait-stable"
                ? preflightSecondInstanceCommand.timeoutMs +
                  CONTROL_RESULT_BUFFER_MS
                : undefined;

        const waitForControlResultAndExit = async (): Promise<void> => {
            try {
                const payload = await awaitControlCommandResult(
                    controlResultRequest,
                    controlResultTimeoutMs
                );
                writeControlCommandResultToProcess(payload);
                process.exit(payload.exitCode);
            } catch (error) {
                process.stderr.write(
                    `${stringifyCliJsonResult(
                        createCliErrorResult({
                            code: "CLI_CONTROL_RESPONSE_TIMEOUT",
                            message:
                                error instanceof Error
                                    ? error.message
                                    : String(error),
                        })
                    )}\n`
                );
                process.exit(CLI_EXIT_CODES.EXECUTION_FAILED);
            }
        };
        void waitForControlResultAndExit();
    } else {
        log.info("Another instance is already running. Quitting.");
        app.quit();
    }
} else {
    registerSingleInstanceHandlers(windowManager);

    const applyStartupWindowOptions = (
        mainWindow: BrowserWindow,
        options: StartupWindowOptions
    ): void => {
        const [currentX, currentY] = mainWindow.getPosition();
        const [currentWidth, currentHeight] = mainWindow.getSize();

        if (options.position || options.size) {
            mainWindow.setBounds({
                x: options.position?.x ?? currentX,
                y: options.position?.y ?? currentY,
                width: options.size?.width ?? currentWidth,
                height: options.size?.height ?? currentHeight,
            });
        }

        if (options.fullscreen) {
            mainWindow.setFullScreen(true);
        }

        if (options.minimize) {
            mainWindow.once("show", () => {
                if (!mainWindow.isDestroyed()) {
                    mainWindow.minimize();
                }
            });
        }
    };

    app.whenReady().then(async () => {
        // 設定を読み込んでログレベルを適用
        const settings = await settingsRepository.loadSettings();
        if (settings.logLevel) {
            setLogLevel(settings.logLevel as LevelOption);
        }
        await initializeMainI18n(settings.language);

        log.info("App ready, creating windows...");
        void cleanupClipboardCache().catch((error) => {
            log.warn("[clipboard-cache] Startup cleanup failed", error);
        });

        // 1) protocol -> 2) ipc -> 3) window の順で組み立てる
        setupProtocolHandler();

        registerCoreIpcHandlers({
            settingsRepository,
            windowRepository,
            projectRepository,
            windowManager,
        });

        let startupLaunchPlan:
            | Awaited<
                  ReturnType<typeof resolveStartupCliRoute>
              >["startupLaunchPlan"]
            | null = null;
        try {
            const startupRoute = await resolveStartupCliRoute(
                process.argv,
                app.isPackaged,
                process.cwd()
            );
            startupLaunchPlan = startupRoute.startupLaunchPlan;
        } catch (error) {
            reportStartupLaunchParseError(error, cliRuntimeOptions);
        }

        const mainWindow = await windowManager.launchMainWindow({
            skipSplash: Boolean(startupLaunchPlan?.skipSplash),
        });
        log.info("Main window created.");
        if (startupLaunchPlan) {
            applyStartupWindowOptions(
                mainWindow,
                startupLaunchPlan.windowOptions
            );
            startupLaunchPlan.warnings.forEach((warning) => {
                log.warn(`[startup] ${warning}`);
            });
            if (startupLaunchPlan.launchIntent) {
                windowManager.applyLaunchIntent(startupLaunchPlan.launchIntent);
            }
            if (startupLaunchPlan.filePath) {
                windowManager.openFile(startupLaunchPlan.filePath);
            }
        }

        registerWindowIpcHandlers(mainWindow);
        windowManager.registerShortcuts();

        // 開発時のみデバッグツールを有効化
        if (is.dev) {
            installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
                .then(() => {
                    // noop
                })
                .catch(() => {
                    // noop
                });
        }

        windowManager.openDevTools(mainWindow);
    });

    registerShutdownHandlers(windowManager);
}
