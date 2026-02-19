const fs = require('node:fs');
const path = require('node:path');

const BENCH_DIR = path.resolve(process.cwd(), 'test-results', 'bench');
const BASELINE_DIR = path.resolve(process.cwd(), 'benchmarks');
const LATEST_PATH = path.join(BENCH_DIR, 'latest.json');
const BASELINE_PATH = path.join(BASELINE_DIR, 'baseline.json');

const command = process.argv[2];

const ensureBenchDir = () => {
    fs.mkdirSync(BENCH_DIR, { recursive: true });
};

const ensureBaselineDir = () => {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
};

const saveBaseline = () => {
    ensureBenchDir();
    ensureBaselineDir();
    if (!fs.existsSync(LATEST_PATH)) {
        console.error(`latest benchmark result not found: ${LATEST_PATH}`);
        process.exit(1);
    }
    fs.copyFileSync(LATEST_PATH, BASELINE_PATH);
    console.log(`saved baseline: ${BASELINE_PATH}`);
};

switch (command) {
    case 'save':
        saveBaseline();
        break;
    default:
        console.error('usage: node scripts/bench-baseline.js save');
        process.exit(1);
}
