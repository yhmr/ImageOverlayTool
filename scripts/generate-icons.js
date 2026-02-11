/**
 * Generate .ico and .icns files from a source PNG.
 *
 * Usage:
 *   node scripts/generate-icons.js
 *   node scripts/generate-icons.js --input assets/icon.png --output assets --name icon
 *
 * Notes:
 * - Default ICO mode is "png" to preserve alpha edges on modern Windows.
 * - Use "--ico-mode winexe" only when strict backward compatibility is needed.
 */

const fs = require('fs');
const path = require('path');
const png2icons = require('png2icons');

const ALGORITHMS = {
    nearest: png2icons.NEAREST_NEIGHBOR,
    bilinear: png2icons.BILINEAR,
    bicubic: png2icons.BICUBIC,
    bezier: png2icons.BEZIER,
    hermite: png2icons.HERMITE,
    bicubic2: png2icons.BICUBIC2,
};

function parseArgs(argv) {
    const options = {
        input: path.join(__dirname, '..', 'assets', 'icon.png'),
        output: path.join(__dirname, '..', 'assets'),
        name: 'icon',
        verbose: false,
        algorithm: 'hermite',
        icoMode: 'png',
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        switch (arg) {
            case '--input':
            case '-i':
                options.input = path.resolve(argv[++i]);
                break;
            case '--output':
            case '-o':
                options.output = path.resolve(argv[++i]);
                break;
            case '--name':
            case '-n':
                options.name = argv[++i];
                break;
            case '--algorithm':
            case '-a':
                options.algorithm = String(argv[++i]).toLowerCase();
                break;
            case '--ico-mode':
                options.icoMode = String(argv[++i]).toLowerCase();
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!Object.prototype.hasOwnProperty.call(ALGORITHMS, options.algorithm)) {
        throw new Error(
            `Invalid --algorithm: ${options.algorithm}. Allowed: ${Object.keys(ALGORITHMS).join(', ')}`,
        );
    }

    if (!['png', 'bmp', 'winexe'].includes(options.icoMode)) {
        throw new Error('Invalid --ico-mode. Allowed: png, bmp, winexe');
    }

    return options;
}

function getPngSize(buffer) {
    const signature = '89504e470d0a1a0a';
    if (buffer.subarray(0, 8).toString('hex') !== signature) {
        throw new Error('Input is not a valid PNG file.');
    }

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function createIcoBuffer(input, algorithm, icoMode) {
    if (icoMode === 'png') {
        return png2icons.createICO(input, algorithm, 0, true, false);
    }
    if (icoMode === 'bmp') {
        return png2icons.createICO(input, algorithm, 0, false, false);
    }
    return png2icons.createICO(input, algorithm, 0, false, true);
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const inputPath = path.resolve(options.input);
    const outputDir = path.resolve(options.output);

    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    const input = fs.readFileSync(inputPath);
    const { width, height } = getPngSize(input);
    const minSide = Math.min(width, height);
    const algorithm = ALGORITHMS[options.algorithm];

    if (minSide < 256) {
        console.warn(
            `[warn] Source PNG is ${width}x${height}. ICO quality may be limited (recommended 256x256+).`,
        );
    }
    if (minSide < 512) {
        console.warn(
            `[warn] Source PNG is ${width}x${height}. ICNS quality may be limited (recommended 512x512+).`,
        );
    }

    ensureDir(outputDir);
    png2icons.clearCache();
    png2icons.setLogger(options.verbose ? console.log : null);

    const icoBuffer = createIcoBuffer(input, algorithm, options.icoMode);
    const icnsBuffer = png2icons.createICNS(input, algorithm, 0);

    if (!icoBuffer) {
        throw new Error('Failed to generate ICO file.');
    }
    if (!icnsBuffer) {
        throw new Error('Failed to generate ICNS file.');
    }

    const icoPath = path.join(outputDir, `${options.name}.ico`);
    const icnsPath = path.join(outputDir, `${options.name}.icns`);

    fs.writeFileSync(icoPath, icoBuffer);
    fs.writeFileSync(icnsPath, icnsBuffer);

    console.log(`Generated: ${path.relative(process.cwd(), icoPath)} (mode=${options.icoMode})`);
    console.log(`Generated: ${path.relative(process.cwd(), icnsPath)} (algorithm=${options.algorithm})`);
}

try {
    main();
} catch (error) {
    console.error(`[error] ${error.message}`);
    process.exit(1);
}
