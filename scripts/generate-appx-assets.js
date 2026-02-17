const { Jimp } = require("jimp");
const path = require("path");
const fs = require("fs");

const INPUT_ICON = path.join(__dirname, "../assets/icon.png");
const OUTPUT_DIR = path.join(__dirname, "../assets/appx");

const ASSETS = [
    { file: "StoreLogo.png", width: 50, height: 50 },
    { file: "Square44x44Logo.png", width: 44, height: 44 },
    { file: "Square150x150Logo.png", width: 150, height: 150 },
    { file: "Wide310x150Logo.png", width: 310, height: 150 },
];

const ICON_SCALE_RATIO = 0.78;

async function generateAsset(icon, definition) {
    const { file, width, height } = definition;

    const canvas = new Jimp({
        width,
        height,
        color: 0xffffffff,
    });

    const iconSize = Math.floor(Math.min(width, height) * ICON_SCALE_RATIO);
    const resizedIcon = icon.clone().resize({
        w: iconSize,
        h: iconSize,
    });

    const x = Math.floor((width - iconSize) / 2);
    const y = Math.floor((height - iconSize) / 2);
    canvas.composite(resizedIcon, x, y);

    const outputPath = path.join(OUTPUT_DIR, file);
    await canvas.write(outputPath);
    console.log(`Generated: ${path.relative(process.cwd(), outputPath)}`);
}

async function main() {
    console.log("Generating APPX tile assets...");

    if (!fs.existsSync(INPUT_ICON)) {
        throw new Error(`Input icon not found: ${INPUT_ICON}`);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const icon = await Jimp.read(INPUT_ICON);

    for (const asset of ASSETS) {
        await generateAsset(icon, asset);
    }

    console.log("APPX tile assets generation completed.");
}

main().catch((error) => {
    console.error("Failed to generate APPX tile assets:", error);
    process.exit(1);
});
