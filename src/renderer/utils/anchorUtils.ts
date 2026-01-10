import { Point } from "../../shared/types/Point";
import { AnchorPos } from "../types/AnchorPos";

// 画像全体のドラッグ移動後の新しいアンカー位置を計算する
export const calculateMovedAnchors = (
  currentAnchors: AnchorPos,
  diff: Point
): AnchorPos => {
  return {
    lt: { x: currentAnchors.lt.x + diff.x, y: currentAnchors.lt.y + diff.y },
    lb: { x: currentAnchors.lb.x + diff.x, y: currentAnchors.lb.y + diff.y },
    rt: { x: currentAnchors.rt.x + diff.x, y: currentAnchors.rt.y + diff.y },
    rb: { x: currentAnchors.rb.x + diff.x, y: currentAnchors.rb.y + diff.y },
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
