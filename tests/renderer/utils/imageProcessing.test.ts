import { describe, it, expect } from 'vitest';
import { rgbToHsv, hsvToRgb } from '../../../src/renderer/utils/imageProcessing';

describe('imageProcessing', () => {
    describe('rgbToHsv', () => {
        it('should convert black correctly', () => {
            expect(rgbToHsv(0, 0, 0)).toEqual([0, 0, 0]);
        });

        it('should convert white correctly', () => {
            expect(rgbToHsv(255, 255, 255)).toEqual([0, 0, 100]);
        });

        it('should convert red correctly', () => {
            expect(rgbToHsv(255, 0, 0)).toEqual([0, 100, 100]);
        });

        it('should convert green correctly', () => {
            expect(rgbToHsv(0, 255, 0)).toEqual([120, 100, 100]);
        });

        it('should convert blue correctly', () => {
            expect(rgbToHsv(0, 0, 255)).toEqual([240, 100, 100]);
        });

        it("should normalize negative hue into 0-360 range", () => {
            const [h] = rgbToHsv(255, 0, 128);
            expect(h).toBeGreaterThan(300);
            expect(h).toBeLessThan(360);
        });
    });

    describe('hsvToRgb', () => {
        it('should convert black correctly', () => {
            expect(hsvToRgb(0, 0, 0)).toEqual([0, 0, 0]);
        });

        it('should convert white correctly', () => {
            expect(hsvToRgb(0, 0, 100)).toEqual([255, 255, 255]);
        });

        it('should convert red correctly', () => {
            expect(hsvToRgb(0, 100, 100)).toEqual([255, 0, 0]);
        });

        it("should convert hue ranges for all segments", () => {
            expect(hsvToRgb(30, 100, 100)).toEqual([255, 128, 0]);
            expect(hsvToRgb(90, 100, 100)).toEqual([128, 255, 0]);
            expect(hsvToRgb(150, 100, 100)).toEqual([0, 255, 128]);
            expect(hsvToRgb(210, 100, 100)).toEqual([0, 128, 255]);
            expect(hsvToRgb(270, 100, 100)).toEqual([128, 0, 255]);
            expect(hsvToRgb(330, 100, 100)).toEqual([255, 0, 128]);
        });
    });

    describe('Round trip', () => {
        it('should match original values after double conversion', () => {
            const r = 100, g = 150, b = 200;
            const [h, s, v] = rgbToHsv(r, g, b);
            const [r2, g2, b2] = hsvToRgb(h, s, v);

            // 浮動小数点の計算誤差があるため、許容範囲を設けるか、期待値が整数に丸められていることを確認
            // hsvToRgbの実装ではMath.roundしているので整数になるはず
            expect(r2).toBe(r);
            expect(g2).toBe(g);
            expect(b2).toBe(b);
        });
    });
});
