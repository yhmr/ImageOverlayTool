import { bench, describe } from 'vitest';
import { hsvToRgb, rgbToHsv } from '@/renderer/utils/imageProcessing';

/**
 * 画像フィルタ系の基礎演算コストを測るベンチ。
 * 色変換の回帰を検知し、フィルタ体感速度の劣化を早期に把握する。
 */
type Rgb = [number, number, number];
type Hsv = [number, number, number];

const SAMPLE_SIZE = 2048;

const rgbSamples: Rgb[] = Array.from({ length: SAMPLE_SIZE }, (_, index) => [
    (index * 53) % 256,
    (index * 97) % 256,
    (index * 193) % 256,
]);

const hsvSamples: Hsv[] = Array.from({ length: SAMPLE_SIZE }, (_, index) => [
    (index * 137) % 360,
    (index * 29) % 101,
    (index * 43) % 101,
]);

describe('imageProcessing benchmark', () => {
    bench('rgbToHsv batch(2048)', () => {
        for (const [r, g, b] of rgbSamples) {
            rgbToHsv(r, g, b);
        }
    });

    bench('hsvToRgb batch(2048)', () => {
        for (const [h, s, v] of hsvSamples) {
            hsvToRgb(h, s, v);
        }
    });
});
