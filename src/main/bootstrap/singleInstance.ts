import { app, type BrowserWindow } from "electron";

import log from "../logger";
import type { WindowManager } from "../windows/windowManager";
import {
    reportSecondInstanceCommandExecutionError,
    reportSecondInstanceRouteParseError,
} from "./cliErrorHandler";
import { CliRouteParseError } from "./cliRouter";
import {
    buildControlAdditionalData,
    type ControlCommandResultRequest,
    resolveControlCommandResultRequest,
    resolveParsedCommand,
    writeControlCommandExecutionFailedResult,
    writeControlCommandInvalidArgumentResult,
    writeControlCommandSuccessResult,
} from "./controlCommandResult";
import { resolveCliRuntimeOptions } from "./cliRuntimeOptions";
import { resolveSecondInstanceCliRoute } from "./cliRouter";
import { executeSecondInstanceCommand } from "./secondInstanceCommand";
import type { SecondInstanceCommand } from "./secondInstance/types";
import { type StartupWindowOptions } from "./startupLaunch";

export const acquireSingleInstanceLock = (
    controlResultRequest?: ControlCommandResultRequest,
    parsedCommand?: SecondInstanceCommand
): boolean => {
    if (!controlResultRequest) {
        return app.requestSingleInstanceLock();
    }
    return app.requestSingleInstanceLock(
        buildControlAdditionalData(controlResultRequest, parsedCommand)
    );
};

export const registerSingleInstanceHandlers = (
    windowManager: WindowManager
): void => {
    const applyWindowOptions = (
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
            mainWindow.minimize();
        }
    };

    // 2つ目のインスタンスが起動されたときの処理
    app.on(
        "second-instance",
        async (_event, commandLine, workingDirectory, additionalData) => {
            log.debug(
                `[second-instance] commandLine=${JSON.stringify(commandLine)}`
            );
            const controlResultRequest =
                resolveControlCommandResultRequest(additionalData);
            const runtimeOptions = resolveCliRuntimeOptions(
                commandLine,
                app.isPackaged
            );
            const mainWindow = windowManager.getMainWindow();
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
            }

            // additionalData に解析済みコマンドがあれば、commandLine の再解析をスキップ。
            // Chromium の CommandLine が POSIX 上でスイッチを positional args の前に
            // 並べ替えるため、commandLine の引数順序は信頼できない。
            const preResolved = resolveParsedCommand(additionalData);
            if (preResolved && controlResultRequest) {
                const command = preResolved as SecondInstanceCommand;
                try {
                    await executeSecondInstanceCommand(command, windowManager);
                    log.debug(
                        "[second-instance] control command executed (pre-resolved)"
                    );
                    await writeControlCommandSuccessResult(
                        controlResultRequest
                    );
                } catch (error) {
                    reportSecondInstanceCommandExecutionError(
                        error,
                        runtimeOptions
                    );
                    await writeControlCommandExecutionFailedResult(
                        controlResultRequest,
                        error
                    );
                }
                return;
            }

            let cliRoute: Awaited<
                ReturnType<typeof resolveSecondInstanceCliRoute>
            >;
            try {
                const hasWorkingDirectory =
                    typeof workingDirectory === "string" &&
                    workingDirectory.trim().length > 0;
                cliRoute = hasWorkingDirectory
                    ? await resolveSecondInstanceCliRoute(
                          commandLine,
                          app.isPackaged,
                          workingDirectory
                      )
                    : await resolveSecondInstanceCliRoute(
                          commandLine,
                          app.isPackaged
                      );
            } catch (error) {
                reportSecondInstanceRouteParseError(error, runtimeOptions);
                if (controlResultRequest) {
                    if (
                        error instanceof CliRouteParseError &&
                        error.stage === "control"
                    ) {
                        await writeControlCommandInvalidArgumentResult(
                            controlResultRequest,
                            error
                        );
                    } else {
                        await writeControlCommandExecutionFailedResult(
                            controlResultRequest,
                            error
                        );
                    }
                }
                return;
            }

            log.debug(`[second-instance] route kind=${cliRoute.kind}`);

            if (cliRoute.kind === "control") {
                try {
                    await executeSecondInstanceCommand(
                        cliRoute.command,
                        windowManager
                    );
                    log.debug("[second-instance] control command executed");
                    if (controlResultRequest) {
                        await writeControlCommandSuccessResult(
                            controlResultRequest
                        );
                    }
                } catch (error) {
                    reportSecondInstanceCommandExecutionError(
                        error,
                        runtimeOptions
                    );
                    if (controlResultRequest) {
                        await writeControlCommandExecutionFailedResult(
                            controlResultRequest,
                            error
                        );
                    }
                }
                return;
            }

            const { startupLaunchPlan } = cliRoute;

            if (mainWindow) {
                applyWindowOptions(mainWindow, startupLaunchPlan.windowOptions);
            }

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
    );

    // macOSでファイルが開かれたときの処理
    app.on("open-file", (event, path) => {
        event.preventDefault();
        windowManager.openFile(path);
    });
};
