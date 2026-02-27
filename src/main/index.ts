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
    createCliSuccessResult,
    stringifyCliJsonResult,
} from "./bootstrap/cliResult";
import {
    reportStartupLaunchParseError,
    writeCliInvalidArgumentError,
    writeCliSceneValidationError,
} from "./bootstrap/cliErrorHandler";
import { initializeRuntimeEnvironment } from "./bootstrap/runtime";
import {
    acquireSingleInstanceLock,
    registerSingleInstanceHandlers,
} from "./bootstrap/singleInstance";
import { resolveStartupCliRoute } from "./bootstrap/cliRouter";
import { type StartupWindowOptions } from "./bootstrap/startupLaunch";
import { resolveE2ERuntimeConfig } from "./e2e/runtimeConfig";
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

const e2eConfig = resolveE2ERuntimeConfig();
initializeRuntimeEnvironment(e2eConfig);

let cliHelpRequest: ReturnType<typeof resolveCliHelpRequest> = null;
let cliSceneTemplateRequest: ReturnType<typeof resolveCliSceneTemplateRequest> =
    null;
let cliValidateSceneRequest: ReturnType<typeof resolveCliValidateSceneRequest> =
    null;
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

const gotTheLock = acquireSingleInstanceLock(e2eConfig.enabled);
log.info("Application starting...");

if (!gotTheLock) {
    log.info("Another instance is already running. Quitting.");
    app.quit();
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
            e2eConfig,
        });

        let startupLaunchPlan:
            | Awaited<
                  ReturnType<typeof resolveStartupCliRoute>
              >["startupLaunchPlan"]
            | null = null;
        try {
            const startupRoute = await resolveStartupCliRoute(
                process.argv,
                app.isPackaged
            );
            startupLaunchPlan = startupRoute.startupLaunchPlan;
        } catch (error) {
            reportStartupLaunchParseError(error);
        }

        const mainWindow = await windowManager.launchMainWindow({
            skipSplash:
                e2eConfig.enabled || Boolean(startupLaunchPlan?.skipSplash),
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
        if (is.dev && !e2eConfig.enabled) {
            installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
                .then(() => {
                    // noop
                })
                .catch(() => {
                    // noop
                });
        }

        windowManager.openDevTools(mainWindow, e2eConfig.enabled);
    });

    registerShutdownHandlers(windowManager);
}
