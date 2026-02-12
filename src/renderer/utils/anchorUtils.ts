import { Point } from "../../shared/types/Point";
import { AnchorPos } from "../../shared/types/AnchorPos";

// 画像全体のドラッグ移動後の新しいアンカー位置を計算する
export const calculateMovedAnchors = (
    currentAnchors: AnchorPos,
    diff: Point
): AnchorPos => {
    return {
        lt: {
            x: currentAnchors.lt.x + diff.x,
            y: currentAnchors.lt.y + diff.y,
        },
        lb: {
            x: currentAnchors.lb.x + diff.x,
            y: currentAnchors.lb.y + diff.y,
        },
        rt: {
            x: currentAnchors.rt.x + diff.x,
            y: currentAnchors.rt.y + diff.y,
        },
        rb: {
            x: currentAnchors.rb.x + diff.x,
            y: currentAnchors.rb.y + diff.y,
        },
    };
};

// 4つのアンカーから、Canvasが必要とする外接矩形（Bounding Box）を計算する
export const getBoundingBox = (anchors: AnchorPos) => {
    const xValues = [anchors.lt.x, anchors.lb.x, anchors.rt.x, anchors.rb.x];
    const yValues = [anchors.lt.y, anchors.lb.y, anchors.rt.y, anchors.rb.y];

    return {
        left: Math.min(...xValues),
        top: Math.min(...yValues),
        right: Math.max(...xValues),
        bottom: Math.max(...yValues),
    };
};

// 4つのアンカーの中心点を計算する
// 単純に重心（4点の平均）とする
export const getCenter = (anchors: AnchorPos): Point => {
    return {
        x: (anchors.lt.x + anchors.rt.x + anchors.rb.x + anchors.lb.x) / 4,
        y: (anchors.lt.y + anchors.rt.y + anchors.rb.y + anchors.lb.y) / 4,
    };
};

// 指定した点を中心として回転させる
export const rotatePoint = (
    point: Point,
    center: Point,
    angleDegree: number
): Point => {
    const angleRad = (angleDegree * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
        x: center.x + (dx * cos - dy * sin),
        y: center.y + (dx * sin + dy * cos),
    };
};

// アンカー全体を指定した角度（差分）だけ回転させる
export const rotateAnchorPos = (
    currentAnchors: AnchorPos,
    angleDiff: number
): AnchorPos => {
    const center = getCenter(currentAnchors);
    return {
        lt: rotatePoint(currentAnchors.lt, center, angleDiff),
        rt: rotatePoint(currentAnchors.rt, center, angleDiff),
        rb: rotatePoint(currentAnchors.rb, center, angleDiff),
        lb: rotatePoint(currentAnchors.lb, center, angleDiff),
    };
};

/**
 * 変形をリセットする
 * initAnchorPos から元の画像サイズ（幅・高さ）を算出し、
 * currentAnchorPos の重心を維持したまま、回転・歪みなしの矩形に戻す
 */
export const resetTransformation = (
    initAnchorPos: AnchorPos,
    currentAnchorPos: AnchorPos
): AnchorPos => {
    // 元画像のサイズを initAnchorPos から算出（初期状態は軸平行の矩形）
    const width = initAnchorPos.rt.x - initAnchorPos.lt.x;
    const height = initAnchorPos.lb.y - initAnchorPos.lt.y;

    // 現在の重心を維持
    const center = getCenter(currentAnchorPos);

    const halfW = width / 2;
    const halfH = height / 2;

    return {
        lt: { x: center.x - halfW, y: center.y - halfH },
        rt: { x: center.x + halfW, y: center.y - halfH },
        rb: { x: center.x + halfW, y: center.y + halfH },
        lb: { x: center.x - halfW, y: center.y + halfH },
    };
};
