import { useEffect, useMemo, useState } from "react";
import Perspective from "perspectivets";
import type { ImageSet } from "../../../shared/types/ImageSet";
import { getBoundingBox, getCenter } from "../../utils/anchorUtils";
import { rgbToHsv, hsvToRgb } from "../../utils/imageProcessing";

interface UsePerspectiveCanvasProps {
    image: HTMLImageElement;
    imageSet: ImageSet;
}

export const usePerspectiveCanvas = ({
    image,
    imageSet,
}: UsePerspectiveCanvasProps) => {
    // オフスクリーンCanvas
    const canvas = useMemo(() => document.createElement("canvas"), []);
    const [renderTrigger, setRenderTrigger] = useState(0); // 再描画用

    // 描画位置情報の保持
    const [pos, setPos] = useState({
        x: 0,
        y: 0,
        offsetX: 0,
        offsetY: 0,
        left: 0,
        top: 0,
    });

    useEffect(() => {
        if (image && imageSet.currentAnchorPos) {
            // Homography処理
            const { left, top, right, bottom } = getBoundingBox(
                imageSet.currentAnchorPos
            );
            const center = getCenter(imageSet.currentAnchorPos);

            // Canvasサイズなどを更新
            if (
                canvas.width !== right - left ||
                canvas.height !== bottom - top
            ) {
                canvas.width = right - left;
                canvas.height = bottom - top;
            }

            // 画像の配置位置：回転の中心（重心）に配置し、そこからOffsetでCanvas内の描画位置を合わせる
            setPos({
                x: center.x,
                y: center.y,
                offsetX: center.x - left,
                offsetY: center.y - top,
                left,
                top,
            });

            const ctx = canvas.getContext("2d");
            if (ctx) {
                // クリア
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // 透過率
                ctx.globalAlpha = 1.0 - imageSet.transparency;

                // 変形後の図形を記述
                const p = new Perspective(ctx, image);
                p.draw({
                    topLeftX: imageSet.currentAnchorPos.lt.x - left,
                    topLeftY: imageSet.currentAnchorPos.lt.y - top,
                    topRightX: imageSet.currentAnchorPos.rt.x - left,
                    topRightY: imageSet.currentAnchorPos.rt.y - top,
                    bottomRightX: imageSet.currentAnchorPos.rb.x - left,
                    bottomRightY: imageSet.currentAnchorPos.rb.y - top,
                    bottomLeftX: imageSet.currentAnchorPos.lb.x - left,
                    bottomLeftY: imageSet.currentAnchorPos.lb.y - top,
                });

                // フィルタ処理の適用
                const filters = imageSet.filters;
                if (filters) {
                    const binarization = filters.binarization;
                    const hsv = filters.hsv;
                    const needsFilter = binarization?.enabled || hsv?.enabled;

                    if (needsFilter) {
                        const imgData = ctx.getImageData(
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );
                        const data = imgData.data;

                        for (let i = 0; i < data.length; i += 4) {
                            // アルファが0のピクセルはスキップ
                            if (data[i + 3] === 0) continue;

                            let r = data[i];
                            let g = data[i + 1];
                            let b = data[i + 2];

                            // HSV調整
                            if (hsv?.enabled) {
                                const [h, s, v] = rgbToHsv(r, g, b);
                                const nh = (h + hsv.h + 360) % 360;
                                const ns = Math.max(
                                    0,
                                    Math.min(100, s + hsv.s)
                                );
                                const nv = Math.max(
                                    0,
                                    Math.min(100, v + hsv.v)
                                );
                                [r, g, b] = hsvToRgb(nh, ns, nv);
                            }

                            // 2値化
                            if (binarization?.enabled) {
                                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                                const val =
                                    gray >= binarization.threshold ? 255 : 0;
                                r = val;
                                g = val;
                                b = val;
                            }

                            data[i] = r;
                            data[i + 1] = g;
                            data[i + 2] = b;
                        }

                        ctx.putImageData(imgData, 0, 0);
                    }
                }

                // Konva.Imageに更新を通知
                setRenderTrigger((prev) => prev + 1);
            }
        }
    }, [image, imageSet, canvas]);

    return {
        canvas,
        pos,
        renderTrigger,
    };
};
