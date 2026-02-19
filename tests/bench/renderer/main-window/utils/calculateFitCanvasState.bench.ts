import type { ImageSet } from '@/shared/types/ImageSet';
import { calculateFitCanvasState } from '@/renderer/main-window/utils/calculateFitCanvasState';
import { bench, describe } from 'vitest';

/**
 * Fit to Screen 計算の負荷を、画像枚数・回転・無効データ混在で測るベンチ。
 * 画像が増えたときの描画操作レスポンス低下を検知する。
 */
const createImageSet = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
): ImageSet => ({
    id,
    path: `local-file://bench-${id}.png`,
    transparency: 0,
    rotation,
    initAnchorPos: null,
    currentAnchorPos: {
        lt: { x, y },
        rt: { x: x + width, y },
        rb: { x: x + width, y: y + height },
        lb: { x, y: y + height },
    },
    sourceType: 'file',
    locked: false,
    visible: true,
    filters: {
        binarization: { enabled: false, threshold: 128 },
        hsv: { enabled: false, h: 0, s: 0, v: 0 },
    },
});

const generateImageSets = (count: number, withRotation: boolean): ImageSet[] =>
    Array.from({ length: count }, (_, index) => {
        const col = index % 20;
        const row = Math.floor(index / 20);
        const x = col * 180;
        const y = row * 140;
        const width = 120 + (index % 7) * 8;
        const height = 80 + (index % 5) * 12;
        const rotation = withRotation ? (index * 17) % 360 : 0;

        return createImageSet(`img-${index}`, x, y, width, height, rotation);
    });

const imageSets10 = generateImageSets(10, false);
const imageSets200 = generateImageSets(200, true);
const imageSets200WithInvalid = imageSets200.map((imageSet, index) => {
    if (index % 10 === 0) {
        return {
            ...imageSet,
            path: '',
            currentAnchorPos: null,
        };
    }
    return imageSet;
});

describe('calculateFitCanvasState benchmark', () => {
    bench('10 images (no rotation)', () => {
        calculateFitCanvasState({
            imageSets: imageSets10,
            viewportWidth: 1920,
            viewportHeight: 1080,
        });
    });

    bench('200 images (mixed rotation)', () => {
        calculateFitCanvasState({
            imageSets: imageSets200,
            viewportWidth: 1920,
            viewportHeight: 1080,
        });
    });

    bench('200 images (10% invalid entries)', () => {
        calculateFitCanvasState({
            imageSets: imageSets200WithInvalid,
            viewportWidth: 1920,
            viewportHeight: 1080,
        });
    });
});
