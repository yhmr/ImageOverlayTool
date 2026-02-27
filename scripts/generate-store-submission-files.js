const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const pkg = require("../package.json");

const ROOT_DIR = path.join(__dirname, "..");
const STORE_SUBMISSION_DOCS_DIR = path.join("docs", "store-submission");

const TEMPLATE_TARGETS = [
    {
        label: "Store license terms",
        template: path.join(
            STORE_SUBMISSION_DOCS_DIR,
            "STORE_LICENSE_TERMS.template.txt"
        ),
        output: path.join(
            STORE_SUBMISSION_DOCS_DIR,
            "STORE_LICENSE_TERMS.txt"
        ),
    },
    {
        label: "Source code URL notice",
        template: path.join(
            STORE_SUBMISSION_DOCS_DIR,
            "SOURCE_CODE_URL.template.txt"
        ),
        output: path.join(STORE_SUBMISSION_DOCS_DIR, "SOURCE_CODE_URL.txt"),
    },
];

const safeExec = (command) => {
    try {
        return childProcess
            .execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
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

const renderTemplate = (template, releaseRef) =>
    template.replace(/<release-tag-or-commit>/g, releaseRef);

const releaseRef = resolveReleaseRef();

for (const target of TEMPLATE_TARGETS) {
    const templatePath = path.join(ROOT_DIR, target.template);
    const outputPath = path.join(ROOT_DIR, target.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const templateText = fs.readFileSync(templatePath, "utf-8");
    const renderedText = renderTemplate(templateText, releaseRef);
    fs.writeFileSync(outputPath, renderedText, "utf-8");
    console.log(`${target.label} generated: ${outputPath}`);
}

console.log(`Resolved release ref: ${releaseRef}`);
