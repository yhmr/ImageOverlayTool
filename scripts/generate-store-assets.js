const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const INPUT_ICON = path.join(__dirname, '../assets/icon.png');
const OUTPUT_DIR = path.join(__dirname, '../release/store-assets');

async function main() {
    console.log('Generating store assets...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const icon = await Jimp.read(INPUT_ICON);

    // 1. App Tile Icon (300x300)
    const tileIcon = icon.clone();
    tileIcon.resize({ w: 300, h: 300 });
    const tileIconPath = path.join(OUTPUT_DIR, 'StoreLogo.300x300.png');
    await tileIcon.write(tileIconPath);
    console.log(`Generated: ${path.relative(process.cwd(), tileIconPath)}`);

    // 2. Poster Art (1440x2160)
    const posterWidth = 1440;
    const posterHeight = 2160;

    // Jimp v1.x: Object argument for constructor
    const poster = new Jimp({ width: posterWidth, height: posterHeight, color: 0xFFFFFFFF });

    const posterIconSize = Math.floor(posterWidth * 0.4);
    const posterIcon = icon.clone();
    posterIcon.resize({ w: posterIconSize, h: posterIconSize });

    const x = (posterWidth - posterIconSize) / 2;
    const y = (posterHeight - posterIconSize) / 2;

    // composite(src, x, y) might still work or needs object?
    // Trying standard args first, if fails will try object.
    poster.composite(posterIcon, x, y);

    const posterPath = path.join(OUTPUT_DIR, 'PosterArt.1440x2160.png');
    await poster.write(posterPath);
    console.log(`Generated: ${path.relative(process.cwd(), posterPath)}`);

    console.log('Done.');
}

main().catch(error => {
    console.error('Error generating assets:', error);
    process.exit(1);
});
