const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const pkg = require("../package.json");

const TEMPLATE_PATH = path.join(__dirname, "..", "STORE_LICENSE_TERMS.template.txt");
const DEFAULT_OUTPUT_PATH = path.join(
    __dirname,
    "..",
    "STORE_LICENSE_TERMS.txt"
);

const readArg = (name) => {
    const index = process.argv.indexOf(name);
    if (index < 0 || index + 1 >= process.argv.length) {
        return undefined;
    }
    return process.argv[index + 1];
};

const safeExec = (command) => {
    try {
        return childProcess.execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
            .toString()
            .trim();
    } catch {
        return "";
    }
};

const resolveReleaseRef = () => {
    if (process.env["RELEASE_TAG"]) {
        return process.env["RELEASE_TAG"];
    }

    if (
        process.env["GITHUB_REF_TYPE"] === "tag" &&
        process.env["GITHUB_REF_NAME"]
    ) {
        return process.env["GITHUB_REF_NAME"];
    }

    const exactTag = safeExec("git describe --tags --exact-match");
    if (exactTag) {
        return exactTag;
    }

    const shortCommit = safeExec("git rev-parse --short HEAD");
    if (shortCommit) {
        return shortCommit;
    }

    return `v${pkg.version}`;
};

const outputArg = readArg("--output");
const outputPath = outputArg
    ? path.resolve(process.cwd(), outputArg)
    : DEFAULT_OUTPUT_PATH;

const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
const releaseRef = resolveReleaseRef();
const rendered = template.replace(/<release-tag-or-commit>/g, releaseRef);

fs.writeFileSync(outputPath, rendered, "utf-8");
console.log(`Store license terms generated: ${outputPath}`);
console.log(`Resolved release ref: ${releaseRef}`);
