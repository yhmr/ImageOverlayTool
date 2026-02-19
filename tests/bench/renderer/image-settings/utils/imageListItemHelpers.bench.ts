import type { AnchorPos } from '@/shared/types/AnchorPos';
import type { ImageSet } from '@/shared/types/ImageSet';
import {
    applyScaleToImageSet,
    calculateImageScale,
    resolveRelinkInitAnchorPos,
} from '@/renderer/image-settings/utils/imageListItemHelpers';
import { bench, describe } from 'vitest';

/**
 * 画像設定ウィンドウの一括更新処理を想定したベンチ。
 * 画像件数が多い時のスケール適用や再リンク判定の回帰を監視する。
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

const createImageSet = (index: number): ImageSet => {
    const width = 100 + (index % 8) * 12;
    const height = 80 + (index % 6) * 10;
    const initAnchorPos = createAnchorPos(0, 0, width, height);
    const currentAnchorPos = createAnchorPos(
        index * 2,
        index * 1.5,
        width * 1.2,
        height * 1.2
    );

    return {
        id: `image-${index}`,
        path: `local-file://bench-image-${index}.png`,
        sourceType: 'file',
        transparency: 0,
        rotation: 0,
        initAnchorPos,
        currentAnchorPos,
        locked: false,
        visible: true,
        filters: {
            binarization: { enabled: false, threshold: 128 },
            hsv: { enabled: false, h: 0, s: 0, v: 0 },
        },
    };
};

const imageSets300 = Array.from({ length: 300 }, (_, index) =>
    createImageSet(index)
);

let numberSink = 0;
let imageSetSink: ImageSet | null = null;
let anchorSink: AnchorPos | null = null;

describe('imageListItemHelpers benchmark', () => {
    bench('calculateImageScale x300', () => {
        let total = 0;
        for (const imageSet of imageSets300) {
            total += calculateImageScale(imageSet);
        }
        numberSink = total;
    });

    bench('applyScaleToImageSet x300', () => {
        const nextScale = 1.35;
        let last: ImageSet | null = null;
        for (const imageSet of imageSets300) {
            last = applyScaleToImageSet(imageSet, nextScale);
        }
        imageSetSink = last;
    });

    bench('resolveRelinkInitAnchorPos x300 (same size)', () => {
        let last: AnchorPos | null = null;
        for (const imageSet of imageSets300) {
            const initAnchorPos = imageSet.initAnchorPos;
            if (!initAnchorPos) {
                continue;
            }
            last = resolveRelinkInitAnchorPos(initAnchorPos, {
                exists: true,
                width: Math.abs(initAnchorPos.rt.x - initAnchorPos.lt.x),
                height: Math.abs(initAnchorPos.lb.y - initAnchorPos.lt.y),
            });
        }
        anchorSink = last;
    });

    bench('resolveRelinkInitAnchorPos x300 (size changed)', () => {
        let last: AnchorPos | null = null;
        for (const imageSet of imageSets300) {
            const initAnchorPos = imageSet.initAnchorPos;
            if (!initAnchorPos) {
                continue;
            }
            last = resolveRelinkInitAnchorPos(initAnchorPos, {
                exists: true,
                width: 512,
                height: 512,
            });
        }
        anchorSink = last;
    });
});
