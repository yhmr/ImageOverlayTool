import { expect, test, describe } from 'vitest';
import { calculateMovedAnchors, getBoundingBox } from './anchorUtils';
import { AnchorPos } from '../types/AnchorPos';

describe('anchorUtils', () => {
    const initialAnchors: AnchorPos = {
        lt: { x: 0, y: 0 },
        rt: { x: 100, y: 0 },
        lb: { x: 0, y: 100 },
        rb: { x: 100, y: 100 },
    };

    test('calculateMovedAnchors shifts all anchors correctly', () => {
        const diff = { x: 10, y: 20 };
        const moved = calculateMovedAnchors(initialAnchors, diff);
        expect(moved.lt).toEqual({ x: 10, y: 20 });
        expect(moved.rt).toEqual({ x: 110, y: 20 });
        expect(moved.lb).toEqual({ x: 10, y: 120 });
        expect(moved.rb).toEqual({ x: 110, y: 120 });
    });

    test('getBoundingBox calculates correct bounds', () => {
        const bounds = getBoundingBox(initialAnchors);
        expect(bounds).toEqual({
            left: 0,
            top: 0,
            right: 100,
            bottom: 100,
        });
    });
});
