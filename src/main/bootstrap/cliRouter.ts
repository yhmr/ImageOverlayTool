import {
    resolveSecondInstanceCommand,
    type SecondInstanceCommand,
} from "./secondInstanceCommand";
import {
    resolveStartupLaunchPlan,
    type StartupLaunchPlan,
} from "./startupLaunch";

type CliRouteParseStage = "control" | "startup";

export interface StartupCliRoute {
    kind: "startup";
    startupLaunchPlan: StartupLaunchPlan;
}

export interface ControlCliRoute {
    kind: "control";
    command: SecondInstanceCommand;
}

export type CliRoute = StartupCliRoute | ControlCliRoute;

export class CliRouteParseError extends Error {
    readonly stage: CliRouteParseStage;

    constructor(stage: CliRouteParseStage, message: string) {
        super(message);
        this.name = "CliRouteParseError";
        this.stage = stage;
    }
}

const toErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

const wrapRouteError = (
    stage: CliRouteParseStage,
    error: unknown
): CliRouteParseError => new CliRouteParseError(stage, toErrorMessage(error));

const resolveStartupRoute = async (
    commandLine: string[],
    isPackaged: boolean,
    workingDirectory?: string
): Promise<StartupCliRoute> => {
    try {
        const startupLaunchPlan =
            workingDirectory !== undefined
                ? await resolveStartupLaunchPlan(
                      commandLine,
                      isPackaged,
                      workingDirectory
                  )
                : await resolveStartupLaunchPlan(commandLine, isPackaged);
        return {
            kind: "startup",
            startupLaunchPlan,
        };
    } catch (error) {
        throw wrapRouteError("startup", error);
    }
};

export const resolveStartupCliRoute = async (
    commandLine: string[],
    isPackaged: boolean,
    workingDirectory?: string
): Promise<StartupCliRoute> => {
    return resolveStartupRoute(commandLine, isPackaged, workingDirectory);
};

export const resolveSecondInstanceCliRoute = async (
    commandLine: string[],
    isPackaged: boolean,
    workingDirectory?: string
): Promise<CliRoute> => {
    try {
        const secondInstanceCommand =
            workingDirectory !== undefined
                ? resolveSecondInstanceCommand(
                      commandLine,
                      isPackaged,
                      workingDirectory
                  )
                : resolveSecondInstanceCommand(commandLine, isPackaged);

        if (secondInstanceCommand) {
            return {
                kind: "control",
                command: secondInstanceCommand,
            };
        }
    } catch (error) {
        throw wrapRouteError("control", error);
    }

    return resolveStartupRoute(commandLine, isPackaged, workingDirectory);
};
