import { parseAndMigrateProjectFile } from '@/main/repositories/projectSchema';
import { bench, describe } from 'vitest';

/**
 * プロジェクト読込時の parse/migrate コストを測るベンチ。
 * 大規模ファイルや legacy 互換パスの性能劣化を検知する。
 */
const createRawAnchorPos = (x: number, y: number, width: number, height: number) => ({
    lt: { x, y },
    lb: { x, y: y + height },
    rt: { x: x + width, y },
    rb: { x: x + width, y: y + height },
});

const createRawImage = (index: number) => {
    const width = 100 + (index % 9) * 10;
    const height = 80 + (index % 7) * 8;
    const x = (index % 40) * 120;
    const y = Math.floor(index / 40) * 90;
    return {
        id: `image-${index}`,
        path: `local-file://fixture-${index}.png`,
        sourceType: index % 5 === 0 ? 'cache' : 'file',
        transparency: (index * 7) % 101,
        rotation: (index * 13) % 360,
        initAnchorPos: createRawAnchorPos(0, 0, width, height),
        currentAnchorPos: createRawAnchorPos(x, y, width, height),
        locked: index % 3 === 0,
        visible: true,
        filters: {
            binarization: {
                enabled: index % 2 === 0,
                threshold: 32 + (index % 192),
            },
            hsv: {
                enabled: index % 4 === 0,
                h: (index * 5) % 360,
                s: ((index * 3) % 100) - 50,
                v: ((index * 7) % 100) - 50,
            },
        },
    };
};

const createRawDimensionLine = (index: number) => ({
    id: `line-${index}`,
    start: { x: index * 2, y: index * 2 + 10 },
    end: { x: index * 2 + 40, y: index * 2 + 10 },
    color: index % 2 === 0 ? '#AABBCC' : '#334455',
    showUnitLabel: index % 3 === 0,
});

const legacyProject50 = {
    images: Array.from({ length: 50 }, (_, index) => createRawImage(index)),
    settings: { unitFactor: 1, unit: 'um' },
    window: { width: 1280, height: 720, x: 0, y: 0, color: '#00000000' },
};

const project300WithLines = {
    version: '1.0.0',
    images: Array.from({ length: 300 }, (_, index) => createRawImage(index)),
    settings: { unitFactor: 0.5, unit: 'nm' },
    window: { width: 1920, height: 1080, x: 10, y: 20, color: '#11223344' },
    canvas: { x: 12.4, y: -4.2, scale: 0.85 },
    dimensionLines: Array.from({ length: 240 }, (_, index) =>
        createRawDimensionLine(index)
    ),
};

const project300LegacyAnchorKeys = {
    version: '1.0.0',
    images: Array.from({ length: 300 }, (_, index) => {
        const image = createRawImage(index);
        return {
            ...image,
            initAnchorPos: undefined,
            currentAnchorPos: undefined,
            init_anchor_pos: image.initAnchorPos,
            current_anchor_pos: image.currentAnchorPos,
        };
    }),
    settings: { unitFactor: 2.5, unit: 'mm' },
    window: { width: 1600, height: 900, x: -10, y: -20, color: '#00000000' },
};

describe('projectSchema benchmark', () => {
    bench('parse legacy project (50 images)', () => {
        parseAndMigrateProjectFile(legacyProject50);
    });

    bench('parse current project (300 images + 240 lines)', () => {
        parseAndMigrateProjectFile(project300WithLines);
    });

    bench('parse current project with legacy anchor keys (300 images)', () => {
        parseAndMigrateProjectFile(project300LegacyAnchorKeys);
    });
});
