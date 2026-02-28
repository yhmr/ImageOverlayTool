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

    it("rejects --add-image when file does not exist", () => {
        const missingPath = path.join(tempDir, "missing.png");

        expect(() =>
            resolveSecondInstanceCommand(
                ["node", "index.js", "control", "--add-image", missingPath],
                false
            )
        ).toThrow(`--add-image file not found: ${missingPath}`);
    });

    it("rejects --add-image when image format is unsupported", () => {
        const invalidImagePath = path.join(tempDir, "sample.txt");
        fs.writeFileSync(invalidImagePath, "txt");

        expect(() =>
            resolveSecondInstanceCommand(
                ["node", "index.js", "control", "--add-image", invalidImagePath],
                false
            )
        ).toThrow(`Unsupported image format: ${invalidImagePath}`);
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

    it("rejects --switch-scene when scene file does not exist", () => {
        const missingScenePath = path.join(tempDir, "missing.scene.json");

        expect(() =>
            resolveSecondInstanceCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--switch-scene",
                    missingScenePath,
                ],
                false
            )
        ).toThrow(`--switch-scene file not found: ${missingScenePath}`);
    });

    it("parses --capture-window output path", () => {
        const outputPath = path.join(tempDir, "capture.png");
        const command = resolveSecondInstanceCommand(
            ["node", "index.js", "control", "--capture-window", outputPath],
            false
        );

        expect(command).toEqual({
            kind: "capture-window",
            outputPath: path.resolve(outputPath),
        });
    });

    it("rejects --capture-window output path when extension is unsupported", () => {
        const outputPath = path.join(tempDir, "capture.webp");

        expect(() =>
            resolveSecondInstanceCommand(
                ["node", "index.js", "control", "--capture-window", outputPath],
                false
            )
        ).toThrow("--capture-window supports only .png / .jpg / .jpeg.");
    });

    it("parses --save-stage output path", () => {
        const outputPath = path.join(tempDir, "stage.png");
        const command = resolveSecondInstanceCommand(
            ["node", "index.js", "control", "--save-stage", outputPath],
            false
        );

        expect(command).toEqual({
            kind: "save-stage",
            outputPath: path.resolve(outputPath),
        });
    });

    it("rejects --save-stage output path when extension is unsupported", () => {
        const outputPath = path.join(tempDir, "stage.bmp");

        expect(() =>
            resolveSecondInstanceCommand(
                ["node", "index.js", "control", "--save-stage", outputPath],
                false
            )
        ).toThrow("--save-stage supports only .png / .jpg / .jpeg.");
    });

    it("parses --wait-stable with timeout", () => {
        const command = resolveSecondInstanceCommand(
            [
                "node",
                "index.js",
                "control",
                "--wait-stable",
                "--timeout-ms",
                "7000",
            ],
            false
        );

        expect(command).toEqual({
            kind: "wait-stable",
            timeoutMs: 7000,
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

    it("executes capture-window command and writes image to output path", async () => {
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
                kind: "capture-window",
                outputPath,
            },
            windowManager as never
        );

        expect(mainWindow.capturePage).toHaveBeenCalledTimes(1);
        expect(fs.existsSync(outputPath)).toBe(true);
        expect(fs.readFileSync(outputPath)).toEqual(Buffer.from("png-data"));
    });

    it("restores minimized window and writes jpeg buffer for .jpg output", async () => {
        const outputPath = path.join(tempDir, "exports", "capture.jpg");
        const nativeImage = {
            toPNG: vi.fn(() => Buffer.from("png-data")),
            toJPEG: vi.fn(() => Buffer.from("jpeg-data")),
        };
        const mainWindow = {
            isDestroyed: vi.fn(() => false),
            isMinimized: vi.fn(() => true),
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
                kind: "capture-window",
                outputPath,
            },
            windowManager as never
        );

        expect(mainWindow.restore).toHaveBeenCalledOnce();
        expect(nativeImage.toJPEG).toHaveBeenCalledWith(90);
        expect(fs.readFileSync(outputPath)).toEqual(Buffer.from("jpeg-data"));
    });

    it("throws when capture-window is requested without an active main window", async () => {
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => null),
        };

        await expect(
            executeSecondInstanceCommand(
                {
                    kind: "capture-window",
                    outputPath: path.join(tempDir, "capture.png"),
                },
                windowManager as never
            )
        ).rejects.toThrow("Main window is not available for --capture-window");
    });

    it("executes save-stage command and writes image to output path", async () => {
        const outputPath = path.join(tempDir, "exports", "stage.png");
        const mainWindow = {
            isDestroyed: vi.fn(() => false),
            isMinimized: vi.fn(() => false),
            restore: vi.fn(),
            isVisible: vi.fn(() => true),
            show: vi.fn(),
            webContents: {
                executeJavaScript: vi
                    .fn()
                    .mockResolvedValue(
                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6pS5UAAAAASUVORK5CYII="
                    ),
            },
        };
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => mainWindow),
        };

        await executeSecondInstanceCommand(
            {
                kind: "save-stage",
                outputPath,
            },
            windowManager as never
        );

        expect(mainWindow.webContents.executeJavaScript).toHaveBeenCalledTimes(1);
        expect(fs.existsSync(outputPath)).toBe(true);
        expect(fs.readFileSync(outputPath).length).toBeGreaterThan(0);
    });

    it("throws when --save-stage returns unsupported data URL", async () => {
        const mainWindow = {
            isDestroyed: vi.fn(() => false),
            isMinimized: vi.fn(() => false),
            restore: vi.fn(),
            isVisible: vi.fn(() => true),
            show: vi.fn(),
            webContents: {
                executeJavaScript: vi
                    .fn()
                    .mockResolvedValue("data:image/gif;base64,aW52YWxpZA=="),
            },
        };
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => mainWindow),
        };

        await expect(
            executeSecondInstanceCommand(
                {
                    kind: "save-stage",
                    outputPath: path.join(tempDir, "stage.png"),
                },
                windowManager as never
            )
        ).rejects.toThrow("--save-stage returned an unsupported data URL.");
    });

    it("throws when --save-stage returns mismatched mime type", async () => {
        const outputPath = path.join(tempDir, "exports", "stage.jpg");
        const mainWindow = {
            isDestroyed: vi.fn(() => false),
            isMinimized: vi.fn(() => false),
            restore: vi.fn(),
            isVisible: vi.fn(() => true),
            show: vi.fn(),
            webContents: {
                executeJavaScript: vi
                    .fn()
                    .mockResolvedValue(
                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6pS5UAAAAASUVORK5CYII="
                    ),
            },
        };
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => mainWindow),
        };

        await expect(
            executeSecondInstanceCommand(
                {
                    kind: "save-stage",
                    outputPath,
                },
                windowManager as never
            )
        ).rejects.toThrow("--save-stage returned image/png, expected image/jpeg.");
    });

    it("throws when save-stage is requested without an active main window", async () => {
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => null),
        };

        await expect(
            executeSecondInstanceCommand(
                {
                    kind: "save-stage",
                    outputPath: path.join(tempDir, "stage.png"),
                },
                windowManager as never
            )
        ).rejects.toThrow("Main window is not available for --save-stage");
    });

    it("executes wait-stable command when main window is stable", async () => {
        const mainWindow = {
            isDestroyed: vi.fn(() => false),
            isMinimized: vi.fn(() => true),
            restore: vi.fn(),
            isVisible: vi.fn(() => true),
            show: vi.fn(),
            webContents: {
                isLoading: vi.fn(() => false),
                isLoadingMainFrame: vi.fn(() => false),
            },
        };
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => mainWindow),
        };

        await executeSecondInstanceCommand(
            {
                kind: "wait-stable",
                timeoutMs: 1000,
            },
            windowManager as never
        );

        expect(mainWindow.restore).toHaveBeenCalledOnce();
        expect(windowManager.applyAppControlCommand).not.toHaveBeenCalled();
        expect(windowManager.openFile).not.toHaveBeenCalled();
    });

    it("throws when wait-stable is requested without an active main window", async () => {
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => null),
        };

        await expect(
            executeSecondInstanceCommand(
                {
                    kind: "wait-stable",
                    timeoutMs: 1000,
                },
                windowManager as never
            )
        ).rejects.toThrow("Main window is not available for --wait-stable");
    });

    it("throws when --wait-stable times out", async () => {
        const mainWindow = {
            isDestroyed: vi.fn(() => false),
            isMinimized: vi.fn(() => false),
            restore: vi.fn(),
            isVisible: vi.fn(() => true),
            show: vi.fn(),
            webContents: {
                isLoading: vi.fn(() => true),
                isLoadingMainFrame: vi.fn(() => true),
            },
        };
        const windowManager = {
            applyAppControlCommand: vi.fn(),
            openFile: vi.fn(),
            getMainWindow: vi.fn(() => mainWindow),
        };

        await expect(
            executeSecondInstanceCommand(
                {
                    kind: "wait-stable",
                    timeoutMs: 150,
                },
                windowManager as never
            )
        ).rejects.toThrow("--wait-stable timed out after 150ms.");
    });
});
