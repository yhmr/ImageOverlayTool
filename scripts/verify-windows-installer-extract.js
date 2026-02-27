const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const RELEASE_DIR = path.join(ROOT_DIR, "release");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const INSTALLER_PATTERN = /^ImageOverlayTool-(.+)-installer-(x64|arm64)\.exe$/i;

const getArgValue = (flag) => {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) {
        return "";
    }
    return String(process.argv[index + 1]).trim();
};

const getExpectedArchList = (archArg) => {
    const arch = (archArg || "all").toLowerCase();
    if (arch === "all") {
        return ["x64", "arm64"];
    }
    if (arch === "x64" || arch === "arm64") {
        return [arch];
    }
    throw new Error(`Unknown --arch '${archArg}'. Expected one of: all, x64, arm64.`);
};

const listWindowsInstallers = () => {
    if (!fs.existsSync(RELEASE_DIR)) {
        throw new Error(`Release directory does not exist: ${RELEASE_DIR}`);
    }

    return fs
        .readdirSync(RELEASE_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && INSTALLER_PATTERN.test(entry.name))
        .map((entry) => {
            const matched = INSTALLER_PATTERN.exec(entry.name);
            const version = matched ? matched[1] : "";
            const arch = matched ? matched[2].toLowerCase() : "";
            return {
                name: entry.name,
                arch,
                version,
                fullPath: path.join(RELEASE_DIR, entry.name),
            };
        });
};

const findInstallerByArchAndVersion = (installers, arch, version) => {
    return installers.find(
        (installer) => installer.arch === arch && installer.version === version
    );
};

const runSilentInstall = (installerPath, installDir) => {
    const result = childProcess.spawnSync(
        installerPath,
        ["/S", `/D=${installDir}`],
        {
            encoding: "utf8",
            timeout: 120000,
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
        }
    );

    if (result.error) {
        throw new Error(
            `Failed to execute installer '${path.basename(installerPath)}': ${result.error.message}`
        );
    }

    if (typeof result.status === "number" && result.status !== 0) {
        const stdout = result.stdout ? String(result.stdout).trim() : "";
        const stderr = result.stderr ? String(result.stderr).trim() : "";
        const details = [stderr, stdout].filter(Boolean).join("\n");
        throw new Error(
            `Installer exited with code ${result.status}: ${path.basename(installerPath)}${details ? `\n${details}` : ""}`
        );
    }
};

const verifyInstalledLayout = (installDir, arch, failures) => {
    const exePath = path.join(installDir, "ImageOverlayTool.exe");
    const uninstallerPath = path.join(installDir, "Uninstall ImageOverlayTool.exe");
    const resourcesDir = path.join(installDir, "resources");

    if (!fs.existsSync(exePath)) {
        failures.push(`${arch}: missing installed executable '${exePath}'`);
        return;
    }

    const exeSize = fs.statSync(exePath).size;
    if (exeSize <= 0) {
        failures.push(`${arch}: installed executable size is zero '${exePath}'`);
    }

    if (!fs.existsSync(uninstallerPath)) {
        failures.push(`${arch}: missing uninstaller '${uninstallerPath}'`);
    }

    if (!fs.existsSync(resourcesDir)) {
        failures.push(`${arch}: missing resources directory '${resourcesDir}'`);
    }
};

const verifyInstaller = (installer, failures) => {
    const sandboxRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), `iot-installer-verify-${installer.arch}-`)
    );
    const installDir = path.join(sandboxRoot, "app");
    fs.mkdirSync(installDir, { recursive: true });

    try {
        runSilentInstall(installer.fullPath, installDir);
        verifyInstalledLayout(installDir, installer.arch, failures);
    } catch (error) {
        const message =
            error instanceof Error && error.message
                ? error.message
                : String(error);
        failures.push(`${installer.arch}: ${message}`);
    } finally {
        fs.rmSync(sandboxRoot, { recursive: true, force: true });
    }
};

const main = () => {
    if (process.platform !== "win32") {
        throw new Error("verify-windows-installer-extract can only run on Windows.");
    }

    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
    const expectedVersion = String(pkg.version || "").trim();
    if (!expectedVersion) {
        throw new Error("package.json version is empty.");
    }

    const archArg = getArgValue("--arch");
    const expectedArchList = getExpectedArchList(archArg);
    const installers = listWindowsInstallers();
    const failures = [];

    for (const arch of expectedArchList) {
        const installer = findInstallerByArchAndVersion(
            installers,
            arch,
            expectedVersion
        );

        if (!installer) {
            failures.push(
                `${arch}: installer not found for version '${expectedVersion}' in release directory`
            );
            continue;
        }

        console.log(
            `[verify-windows-installer-extract] checking ${installer.name}`
        );
        verifyInstaller(installer, failures);
    }

    if (failures.length > 0) {
        throw new Error(
            `Windows installer extraction verification failed.\n${failures
                .map((failure) => `- ${failure}`)
                .join("\n")}`
        );
    }

    console.log(
        `[verify-windows-installer-extract] OK: version=${expectedVersion}, arch=${expectedArchList.join(",")}`
    );
};

main();
