import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/main/logger", () => ({
    default: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import {
    executeSecondInstanceCommand,
    resolveSecondInstanceCommand,
} from "@/main/bootstrap/secondInstanceCommand";

describe("secondInstanceCommand", () => {
    let tempDir: string;
    let imagePath: string;
    let scenePath: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "iot-second-instance-"));
        imagePath = path.join(tempDir, "sample.png");
        scenePath = path.join(tempDir, "default.scene.json");
        fs.writeFileSync(imagePath, "png");
        fs.writeFileSync(scenePath, "{}");
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("returns null when no second-instance command is specified", () => {
        const command = resolveSecondInstanceCommand(
            ["node", "index.js", "--scene", scenePath],
            false
        );

        expect(command).toBeNull();
    });

    it("parses --add-image with optional --opacity", () => {
        const command = resolveSecondInstanceCommand(
            [
                "node",
                "index.js",
                "control",
                "--add-image",
                imagePath,
                "--opacity",
                "50",
            ],
            false
        );

        expect(command).toEqual({
            kind: "app-control",
            command: {
                kind: "add-image",
                imagePath: path.resolve(imagePath),
                opacity: 0.5,
            },
        });
    });

    it("resolves relative --add-image path from provided working directory", () => {
        const workingDirectory = path.join(tempDir, "cwd");
        fs.mkdirSync(workingDirectory, { recursive: true });
        const relativeImagePath = path.join(workingDirectory, "relative.png");
        fs.writeFileSync(relativeImagePath, "png");

        const command = resolveSecondInstanceCommand(
            [
                "node",
                "index.js",
                "control",
                "--add-image",
                "relative.png",
            ],
            false,
            workingDirectory
        );

        expect(command).toEqual({
            kind: "app-control",
            command: {
                kind: "add-image",
                imagePath: relativeImagePath,
                opacity: undefined,
            },
        });
    });

    it("parses --set-opacity", () => {
        const command = resolveSecondInstanceCommand(
            ["node", "index.js", "control", "--set-opacity", "30"],
            false
        );

        expect(command).toEqual({
            kind: "app-control",
            command: {
                kind: "set-opacity",
                opacity: 0.3,
            },
        });
    });

    it("parses control subcommand for second-instance command", () => {
        const command = resolveSecondInstanceCommand(
            ["node", "index.js", "control", "--set-opacity", "30"],
            false
        );

        expect(command).toEqual({
            kind: "app-control",
            command: {
                kind: "set-opacity",
                opacity: 0.3,
            },
        });
    });

    it("returns null for startup subcommand in second-instance parser", () => {
        const command = resolveSecondInstanceCommand(
            ["node", "index.js", "startup", "--scene", scenePath],
            false
        );

        expect(command).toBeNull();
    });

    it("rejects --opacity when --add-image is not used", () => {
        expect(() =>
            resolveSecondInstanceCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--set-opacity",
                    "30",
                    "--opacity",
                    "40",
                ],
                false
            )
        ).toThrow("--opacity can only be used with --add-image");
    });

    it("rejects multiple second-instance commands in one invocation", () => {
        expect(() =>
            resolveSecondInstanceCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--set-opacity",
                    "30",
                    "--switch-scene",
                    scenePath,
                ],
                false
            )
        ).toThrow("Only one second-instance command can be specified");
    });

    it("parses --switch-scene with existing .scene.json path", () => {
        const command = resolveSecondInstanceCommand(
            ["node", "index.js", "control", "--switch-scene", scenePath],
            false
        );

        expect(command).toEqual({
            kind: "switch-scene",
            scenePath: path.resolve(scenePath),
        });
    });

    it("rejects --switch-scene when extension is invalid", () => {
        const invalidPath = path.join(tempDir, "invalid.iot");
        fs.writeFileSync(invalidPath, "{}");

        expect(() =>
            resolveSecondInstanceCommand(
                ["node", "index.js", "control", "--switch-scene", invalidPath],
                false
            )
        ).toThrow("--switch-scene requires a .scene.json path");
    });

    it("parses --export output path", () => {
        const outputPath = path.join(tempDir, "capture.png");
        const command = resolveSecondInstanceCommand(
            ["node", "index.js", "control", "--export", outputPath],
            false
        );

        expect(command).toEqual({
            kind: "export",
            outputPath: path.resolve(outputPath),
        });
    });

    it("rejects flat control command without control subcommand", () => {
        expect(() =>
            resolveSecondInstanceCommand(
                ["node", "index.js", "--set-opacity", "30"],
                false
            )
        ).toThrow('Control commands require the "control" subcommand.');
    });

    it("executes app-control command through WindowManager", async () => {
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => null),
        };
        await executeSecondInstanceCommand(
            {
                kind: "app-control",
                command: {
                    kind: "set-opacity",
                    opacity: 0.4,
                },
            },
            windowManager as never
        );

        expect(windowManager.applyAppControlCommand).toHaveBeenCalledWith({
            kind: "set-opacity",
            opacity: 0.4,
        });
        expect(windowManager.openFile).not.toHaveBeenCalled();
    });

    it("executes switch-scene through WindowManager.openFile", async () => {
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => null),
        };
        await executeSecondInstanceCommand(
            {
                kind: "switch-scene",
                scenePath: path.resolve(scenePath),
            },
            windowManager as never
        );

        expect(windowManager.openFile).toHaveBeenCalledWith(path.resolve(scenePath));
        expect(windowManager.applyAppControlCommand).not.toHaveBeenCalled();
    });

    it("executes export command and writes image to output path", async () => {
        const outputPath = path.join(tempDir, "exports", "capture.png");
        const nativeImage = {
            toPNG: vi.fn(() => Buffer.from("png-data")),
            toJPEG: vi.fn(() => Buffer.from("jpeg-data")),
        };
        const mainWindow = {
            isDestroyed: vi.fn(() => false),
            isMinimized: vi.fn(() => false),
            restore: vi.fn(),
            capturePage: vi.fn().mockResolvedValue(nativeImage),
        };
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => mainWindow),
        };

        await executeSecondInstanceCommand(
            {
                kind: "export",
                outputPath,
            },
            windowManager as never
        );

        expect(mainWindow.capturePage).toHaveBeenCalledTimes(1);
        expect(fs.existsSync(outputPath)).toBe(true);
        expect(fs.readFileSync(outputPath)).toEqual(Buffer.from("png-data"));
    });

    it("throws when export is requested without an active main window", async () => {
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => null),
        };

        await expect(
            executeSecondInstanceCommand(
                {
                    kind: "export",
                    outputPath: path.join(tempDir, "capture.png"),
                },
                windowManager as never
            )
        ).rejects.toThrow("Main window is not available for --export");
    });
});
