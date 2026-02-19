import type { AnchorPos } from '@/shared/types/AnchorPos';
import {
    calculateAnchorScale,
    resetTransformation,
    rotateAnchorPos,
    scaleAnchorPos,
} from '@/renderer/utils/anchorUtils';
import { bench, describe } from 'vitest';

/**
 * ドラッグ中に高頻度で呼ばれる座標計算のベンチ。
 * 単発処理と連続処理の両方を測り、カクつき要因を切り分ける。
 */
const createAnchorPos = (
    x: number,
    y: number,
    width: number,
    height: number
): AnchorPos => ({
    lt: { x, y },
    rt: { x: x + width, y },
    rb: { x: x + width, y: y + height },
    lb: { x, y: y + height },
});

const initAnchor = createAnchorPos(0, 0, 320, 200);
const transformedAnchor = rotateAnchorPos(
    scaleAnchorPos(createAnchorPos(30, 40, 420, 260), 1.15),
    27
);

const batchAnchors: AnchorPos[] = Array.from({ length: 512 }, (_, index) =>
    createAnchorPos(
        (index % 32) * 60,
        Math.floor(index / 32) * 45,
        120 + (index % 7) * 10,
        80 + (index % 5) * 6
    )
);

let anchorSink: AnchorPos = transformedAnchor;

describe('anchorUtils benchmark', () => {
    bench('calculateAnchorScale single', () => {
        calculateAnchorScale(initAnchor, transformedAnchor);
    });

    bench('rotateAnchorPos single (17deg)', () => {
        rotateAnchorPos(transformedAnchor, 17);
    });

    bench('scaleAnchorPos single (1.08x)', () => {
        scaleAnchorPos(transformedAnchor, 1.08);
    });

    bench('resetTransformation single', () => {
        resetTransformation(initAnchor, transformedAnchor);
    });

    bench('batch rotate+scale (512 anchors)', () => {
        let anchor = transformedAnchor;
        for (const current of batchAnchors) {
            anchor = scaleAnchorPos(rotateAnchorPos(current, 9), 1.01);
        }
        anchorSink = anchor;
    });
});
