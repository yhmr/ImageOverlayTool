const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const RELEASE_DIR = path.join(ROOT_DIR, "release");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const ASAR_DLX = "@electron/asar@3.2.17";

const WIN_EXTENSIONS = [
    ".zip",
    ".exe",
    ".appx",
    ".appxbundle",
    ".appxupload",
    ".msix",
    ".msixbundle",
    ".msixupload",
    ".blockmap",
];

const LINUX_EXTENSIONS = [".appimage", ".deb"];

const EXPECTED_ASAR_PATHS = {
    win: [
        path.join("win-unpacked", "resources", "app.asar"),
        path.join("win-arm64-unpacked", "resources", "app.asar"),
    ],
    linux: [
        path.join("linux-unpacked", "resources", "app.asar"),
        path.join("linux-arm64-unpacked", "resources", "app.asar"),
    ],
};

const getArgValue = (flag) => {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) {
        return "";
    }
    return String(process.argv[index + 1]).trim();
};

const run = (command, args, options = {}) => {
    const executable =
        process.platform === "win32" && command === "pnpm"
            ? "pnpm.cmd"
            : command;
    try {
        return childProcess.execFileSync(executable, args, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            maxBuffer: 1024 * 1024 * 20,
            ...options,
        });
    } catch (error) {
        const stderr = error.stderr ? String(error.stderr).trim() : "";
        const stdout = error.stdout ? String(error.stdout).trim() : "";
        const details = [stderr, stdout].filter(Boolean).join("\n");
        const suffix = details ? `\n${details}` : "";
        throw new Error(`Command failed: ${executable} ${args.join(" ")}${suffix}`);
    }
};

const detectArtifactPlatform = (fileName) => {
    const lower = fileName.toLowerCase();
    if (WIN_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
        return "win";
    }
    if (LINUX_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
        return "linux";
    }
    return "";
};

const parseArtifactVersion = (fileName) => {
    const match =
        /^ImageOverlayTool-(\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)/.exec(
            fileName
        );
    return match ? match[1] : "";
};

const readAsarPackageVersion = (asarPath) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "iot-asar-verify-"));
    try {
        run("pnpm", ["dlx", ASAR_DLX, "extract-file", asarPath, "package.json"], {
            cwd: tempDir,
        });
        const packageJsonPath = path.join(tempDir, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error(`Extracted package.json not found from '${asarPath}'.`);
        }
        const parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        return String(parsed.version || "");
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};

const verifyArtifactFileVersions = (expectedVersion, platform, failures) => {
    const entries = fs
        .readdirSync(RELEASE_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile());

    for (const entry of entries) {
        const version = parseArtifactVersion(entry.name);
        if (!version) {
            continue;
        }

        const artifactPlatform = detectArtifactPlatform(entry.name);
        if (platform !== "all" && artifactPlatform !== platform) {
            continue;
        }

        if (!artifactPlatform) {
            continue;
        }

        if (version !== expectedVersion) {
            failures.push(
                `release/${entry.name}: file version '${version}' does not match expected '${expectedVersion}'`
            );
        }
    }
};

const verifyAsarVersions = (expectedVersion, platform, failures) => {
    const platforms = platform === "all" ? ["win", "linux"] : [platform];
    for (const targetPlatform of platforms) {
        const asarRelativePaths = EXPECTED_ASAR_PATHS[targetPlatform] || [];
        for (const relativePath of asarRelativePaths) {
            const absolutePath = path.join(RELEASE_DIR, relativePath);
            if (!fs.existsSync(absolutePath)) {
                failures.push(
                    `Missing packaged app: ${path.join("release", relativePath)}`
                );
                continue;
            }

            const packagedVersion = readAsarPackageVersion(absolutePath);
            if (packagedVersion !== expectedVersion) {
                failures.push(
                    `${path.join("release", relativePath)}: asar version '${packagedVersion || "(empty)"}' does not match expected '${expectedVersion}'`
                );
            }
        }
    }
};

const main = () => {
    const platformArg = getArgValue("--platform") || "all";
    const platform = platformArg.toLowerCase();
    if (!["all", "win", "linux"].includes(platform)) {
        throw new Error(`Unknown --platform '${platformArg}'. Expected one of: all, win, linux.`);
    }

    if (!fs.existsSync(RELEASE_DIR)) {
        throw new Error(`Release directory does not exist: ${RELEASE_DIR}`);
    }

    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
    const expectedVersion = String(pkg.version || "").trim();
    if (!expectedVersion) {
        throw new Error("package.json version is empty.");
    }

    const failures = [];
    verifyArtifactFileVersions(expectedVersion, platform, failures);
    verifyAsarVersions(expectedVersion, platform, failures);

    if (failures.length > 0) {
        throw new Error(
            `Release artifact verification failed (${platform}).\n${failures
                .map((failure) => `- ${failure}`)
                .join("\n")}`
        );
    }

    console.log(
        `[verify-release-artifacts] OK: platform=${platform}, expectedVersion=${expectedVersion}`
    );
};

main();
