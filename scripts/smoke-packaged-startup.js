const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const RELEASE_DIR = path.join(ROOT_DIR, "release");
const FIXTURES_DIR = path.join(ROOT_DIR, "e2e", "fixtures");

const STARTUP_TIMEOUT_MS = 10000;
const MIN_UPTIME_MS = 5000;

const TARGETS = {
    win: [
        {
            name: "win-x64",
            appAsarPath: path.join(
                RELEASE_DIR,
                "win-unpacked",
                "resources",
                "app.asar"
            ),
        },
        {
            name: "win-arm64",
            appAsarPath: path.join(
                RELEASE_DIR,
                "win-arm64-unpacked",
                "resources",
                "app.asar"
            ),
        },
    ],
    linux: [
        {
            name: "linux-x64",
            appAsarPath: path.join(
                RELEASE_DIR,
                "linux-unpacked",
                "resources",
                "app.asar"
            ),
        },
        {
            name: "linux-arm64",
            appAsarPath: path.join(
                RELEASE_DIR,
                "linux-arm64-unpacked",
                "resources",
                "app.asar"
            ),
        },
    ],
};

const getArgValue = (flag) => {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) {
        return "";
    }
    return String(process.argv[index + 1]).trim();
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const killProcessTree = (pid) => {
    if (!pid) return;
    if (process.platform === "win32") {
        childProcess.spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
            stdio: "ignore",
        });
        return;
    }

    try {
        process.kill(-pid, "SIGKILL");
    } catch {
        // ignore
    }
    try {
        process.kill(pid, "SIGKILL");
    } catch {
        // ignore
    }
};

const launchAndObserve = async (electronPath, target) => {
    const sandboxRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), `iot-startup-smoke-${target.name}-`)
    );
    const artifactsDir = path.join(sandboxRoot, "artifacts");
    const appDataDir = path.join(sandboxRoot, "appdata");
    fs.mkdirSync(artifactsDir, { recursive: true });
    fs.mkdirSync(appDataDir, { recursive: true });

    const env = {
        ...process.env,
        APPDATA: appDataDir,
        LOCALAPPDATA: appDataDir,
        HOME: appDataDir,
        XDG_CONFIG_HOME: path.join(appDataDir, ".config"),
        IOT_E2E_ARTIFACTS_DIR: artifactsDir,
        IOT_E2E_FIXTURES_DIR: FIXTURES_DIR,
        IOT_E2E_FIXED_NOW: "1700000000000",
        IOT_E2E_RANDOM_SEED: "424242",
    };
    delete env.ELECTRON_RUN_AS_NODE;

    const startedAt = Date.now();
    const child = childProcess.spawn(
        electronPath,
        [
            target.appAsarPath,
            "--e2e",
            "--no-sandbox",
            "--disable-gpu",
            "--disable-software-rasterizer",
        ],
        {
            stdio: "ignore",
            env,
            detached: process.platform !== "win32",
        }
    );

    const outcome = await new Promise((resolve) => {
        let settled = false;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };

        child.once("error", (error) => {
            finish({
                type: "spawn_error",
                error,
                elapsedMs: Date.now() - startedAt,
                pid: child.pid,
            });
        });

        child.once("exit", (code, signal) => {
            finish({
                type: "exit",
                code,
                signal,
                elapsedMs: Date.now() - startedAt,
                pid: child.pid,
            });
        });

        setTimeout(() => {
            finish({
                type: "timeout",
                elapsedMs: Date.now() - startedAt,
                pid: child.pid,
            });
        }, STARTUP_TIMEOUT_MS);
    });

    killProcessTree(child.pid);
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
    await wait(800);

    return outcome;
};

const evaluateOutcome = (target, outcome, failures) => {
    if (outcome.type === "spawn_error") {
        failures.push(
            `${target.name}: process spawn failed (${outcome.error && outcome.error.message ? outcome.error.message : "unknown error"})`
        );
        return;
    }

    if (outcome.type === "timeout") {
        console.log(
            `[smoke-packaged-startup] PASS: ${target.name} stayed alive for ${outcome.elapsedMs}ms`
        );
        return;
    }

    if (outcome.elapsedMs < MIN_UPTIME_MS) {
        failures.push(
            `${target.name}: exited too early after ${outcome.elapsedMs}ms (code=${String(
                outcome.code
            )}, signal=${String(outcome.signal)})`
        );
        return;
    }

    if (outcome.signal) {
        failures.push(
            `${target.name}: exited by signal=${outcome.signal} after ${outcome.elapsedMs}ms`
        );
        return;
    }

    if (outcome.code && outcome.code !== 0) {
        failures.push(
            `${target.name}: exited with non-zero code=${outcome.code} after ${outcome.elapsedMs}ms`
        );
        return;
    }

    console.log(
        `[smoke-packaged-startup] PASS: ${target.name} ran for ${outcome.elapsedMs}ms`
    );
};

const main = async () => {
    const platformArg = getArgValue("--platform") || "win";
    const platform = platformArg.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(TARGETS, platform)) {
        throw new Error(
            `Unknown --platform '${platformArg}'. Expected one of: ${Object.keys(TARGETS).join(", ")}`
        );
    }

    const targets = TARGETS[platform];
    const missingTargets = targets.filter(
        (target) => !fs.existsSync(target.appAsarPath)
    );
    if (missingTargets.length > 0) {
        throw new Error(
            `Missing packaged targets:\n${missingTargets
                .map((target) => `- ${target.appAsarPath}`)
                .join("\n")}`
        );
    }

    const electronPath = require("electron");
    const failures = [];

    for (const target of targets) {
        console.log(
            `[smoke-packaged-startup] launching ${target.name}: ${target.appAsarPath}`
        );
        const outcome = await launchAndObserve(electronPath, target);
        evaluateOutcome(target, outcome, failures);
    }

    if (failures.length > 0) {
        throw new Error(
            `Packaged startup smoke failed (${platform}).\n${failures
                .map((failure) => `- ${failure}`)
                .join("\n")}`
        );
    }

    console.log(`[smoke-packaged-startup] OK: platform=${platform}`);
};

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
