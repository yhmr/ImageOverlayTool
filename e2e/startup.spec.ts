import { test, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForExit = (proc: ChildProcess) =>
    new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
        (resolve) => {
            proc.once("exit", (code, signal) => {
                resolve({ code, signal });
            });
        }
    );

test("app launch smoke", async () => {
    const electronPath = require("electron") as string;
    const appPath = path.resolve(__dirname, "..");
    const outMainPath = path.join(appPath, "out", "main", "index.js");

    expect(
        fs.existsSync(outMainPath),
        `Missing build output: ${outMainPath}. Run \"npm run build\" before e2e.`
    ).toBeTruthy();

    const env = { ...process.env, NODE_ENV: "test" };
    delete env.ELECTRON_RUN_AS_NODE;

    const child = spawn(
        electronPath,
        [
            appPath,
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--disable-software-rasterizer",
        ],
        {
            stdio: ["ignore", "pipe", "pipe"],
            env,
        }
    );

    let stderr = "";
    let stdout = "";

    child.stderr?.on("data", (data) => {
        stderr += data.toString();
    });
    child.stdout?.on("data", (data) => {
        stdout += data.toString();
    });

    const exitPromise = waitForExit(child);

    const earlyExit = await Promise.race([
        exitPromise,
        wait(5000).then(() => null),
    ]);

    expect(
        earlyExit,
        `Electron exited too early. stdout: ${stdout}\nstderr: ${stderr}`
    ).toBeNull();

    if (child.exitCode === null) {
        child.kill("SIGTERM");
    }

    const terminated = await Promise.race([
        exitPromise.then(() => true),
        wait(5000).then(() => false),
    ]);

    if (!terminated && child.exitCode === null) {
        child.kill("SIGKILL");
        await exitPromise;
    }

    expect(stderr).not.toContain("bad option");
});