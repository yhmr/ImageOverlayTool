import type { AppControlCommand } from "../../../shared/types/AppControlCommand";

export type AppControlSecondInstanceCommand = {
    kind: "app-control";
    command: AppControlCommand;
};

export type SwitchSceneSecondInstanceCommand = {
    kind: "switch-scene";
    scenePath: string;
};

export type CaptureWindowSecondInstanceCommand = {
    kind: "capture-window";
    outputPath: string;
};

export type SaveStageSecondInstanceCommand = {
    kind: "save-stage";
    outputPath: string;
};

export type WaitStableSecondInstanceCommand = {
    kind: "wait-stable";
    timeoutMs: number;
};

export type SecondInstanceCommand =
    | AppControlSecondInstanceCommand
    | SwitchSceneSecondInstanceCommand
    | CaptureWindowSecondInstanceCommand
    | SaveStageSecondInstanceCommand
    | WaitStableSecondInstanceCommand;
