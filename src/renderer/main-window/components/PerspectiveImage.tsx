"use no memo";
import React, { useEffect, useMemo, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import Perspective from "perspectivets";
import { KonvaEventObject } from "konva/lib/Node";
import { Context } from "konva/lib/Context";
import type { ImageSet } from "../../../shared/types/ImageSet";
import { getBoundingBox, getCenter } from "../../utils/anchorUtils";

/** RGB (0-255) → HSV (h: 0-360, s: 0-100, v: 0-100) */
const rgbToHsv = (
    r: number,
    g: number,
    b: number
): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    return [h, s, v];
};

/** HSV (h: 0-360, s: 0-100, v: 0-100) → RGB (0-255) */
const hsvToRgb = (
    h: number,
    s: number,
    v: number
): [number, number, number] => {
    s /= 100;
    v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0,
        g = 0,
        b = 0;
    if (h < 60) {
        r = c;
        g = x;
    } else if (h < 120) {
        r = x;
        g = c;
    } else if (h < 180) {
        g = c;
        b = x;
    } else if (h < 240) {
        g = x;
        b = c;
    } else if (h < 300) {
        r = x;
        b = c;
    } else {
        r = c;
        b = x;
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
};
interface PerspectiveImageProps {
    image: HTMLImageElement;
    imageSet: ImageSet;
    onSelect?: () => void;
}

export const PerspectiveImage = ({
    image,
    imageSet,
    onSelect,
}: PerspectiveImageProps) => {
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

    // クリックハンドラ
    const onImageClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (onSelect) {
            onSelect();
            e.cancelBubble = true; // Stop bubbling to stage
        }
    };

    const onImageMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        // 左クリックの場合はバブリングを止める（ステージのドラッグなどと干渉しないように）
        if ("button" in e.evt && e.evt.button === 0) {
            e.cancelBubble = true;
        }
    };

    return (
        <KonvaImage
            image={canvas}
            x={pos.x}
            y={pos.y}
            rotation={imageSet.rotation || 0}
            offsetX={pos.offsetX}
            offsetY={pos.offsetY}
            onClick={onImageClick}
            onTap={onImageClick}
            onMouseDown={onImageMouseDown}
            listening={true} // Ensure it catches events
            // カスタムヒットファンクション：四角形の内側だけをヒットにする
            hitFunc={(ctx: Context, shape) => {
                if (!imageSet.currentAnchorPos) {
                    ctx.fillStrokeShape(shape);
                    return;
                }
                const { currentAnchorPos } = imageSet;
                const { left, top } = pos;

                ctx.beginPath();
                ctx.moveTo(
                    currentAnchorPos.lt.x - left,
                    currentAnchorPos.lt.y - top
                );
                ctx.lineTo(
                    currentAnchorPos.rt.x - left,
                    currentAnchorPos.rt.y - top
                );
                ctx.lineTo(
                    currentAnchorPos.rb.x - left,
                    currentAnchorPos.rb.y - top
                );
                ctx.lineTo(
                    currentAnchorPos.lb.x - left,
                    currentAnchorPos.lb.y - top
                );
                ctx.closePath();
                // Konvaのヒット検出用に形状を描画
                ctx.fillStrokeShape(shape);
            }}
            // Konva.Imageはデフォルトでlistening=true
            // キャッシュを無効化して常に最新のcanvasを表示するためにkeyを変えるか、
            // imageオブジェクト自体は変わらないので、Konvaが内部でredrawしてくれることを期待
            // 明示的にimage={canvas}を渡しているのでcanvasの中身が変われば描画時に反映されるはずだが、
            // KonvaはHTMLCanvasElementの変更を自動検知しない場合があるため、
            // ステート更新で再レンダリングを促す
            key={renderTrigger}
        />
    );
};
