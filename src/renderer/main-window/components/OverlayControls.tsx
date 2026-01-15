import React, { useRef, useCallback, useLayoutEffect } from "react";
import Konva from "konva";
import { Circle, Line } from "react-konva";
import type { ImageSet } from "../../types/ImageSet";
import type { AnchorPos } from "../../types/AnchorPos";
import { useImageAnchor } from "../../hooks/useImageAnchor";
import { rotateAnchorPos } from "../../utils/anchorUtils";

interface OverlayControlsProps {
  imageSet: ImageSet;
  onUpdateAnchor: (anchorPos: AnchorPos) => void;
}

export const OverlayControls = ({
  imageSet,
  onUpdateAnchor,
}: OverlayControlsProps) => {
  // アンカーとラインのRef
  const ltRef = useRef<Konva.Circle>(null);
  const lbRef = useRef<Konva.Circle>(null);
  const rtRef = useRef<Konva.Circle>(null);
  const rbRef = useRef<Konva.Circle>(null);
  const lineRef = useRef<Konva.Line>(null);

  // 配列化して扱いやすくする
  const cRefs = [ltRef, lbRef, rtRef, rbRef];

  // ドラッグ時の座標補正を行うラッパー
  const onUpdateAnchorWrapper = useCallback(
    (newAnchors: AnchorPos) => {
      // ここでのnewAnchorsは、ドラッグされたアンカー（回転後の世界での座標）が
      // useImageAnchor内でそのまま計算されたものになっている可能性があるが、
      // 実際にはドラッグされたポイントを逆回転させて元の座標系に戻す必要がある。
      // しかし useImageAnchor は「現在のアンカー」を基準に変形を行うため、
      // 単純なラップでは難しいかもしれない。
      // ここでは useImageAnchor の実装に依存するが、
      // useImageAnchor は「ドラッグされたCircleの座標」を使って新しいアンカーセットを計算する。
      // なので、Circleの座標自体が回転後の位置にあるなら、計算結果も回転後の位置になる。
      // したがって、onUpdateAnchor に渡す前に逆回転させる。

      // ただし、newAnchors は4点すべてのセット。
      // 回転中心は、変形前の重心ではなく、変形後の重心...ではない。
      // 「回転」プロパティは不変（ドラッグ中は回らない）と仮定するなら、
      // 回転中心（重心）を基準に -rotation すればよいはず。

      // いや、操作感として、回転した状態で引き伸ばしたら、その方向に伸びてほしい。
      // つまり、ローカル座標系での変形。
      // useImageAnchor が行っている処理が「絶対座標での移動」だとすると、
      // 回転したローカル軸に沿った移動に変換してやる必要がある...が、
      // Perspective変形は自由変形なので、軸に沿う必要はない。

      // 結論：
      // 1. ドラッグされた点 P_rotated
      // 2. 逆回転させて P_original = rotate(P_rotated, -angle)
      // 3. これを新しいアンカー座標とする。

      // useImageAnchorは「コールバックで新しいアンカーセット全体」を返してくる。
      // なので、このセット全体を逆回転させればよい。

      // 重心は「現在の（操作前の）重心」を使うべきか、「操作後の重心」を使うべきか？
      // 回転は中心（重心）で行われるため、操作によって重心が移動すると回転中心も移動する。
      // Konvaの描画ロジックでは「その時点の重心」を回転中心としている。
      // なので、逆回転も「その時点の重心」基準で行うのが整合性が取れるはず。

      if (imageSet.rotation) {
        const corrected = rotateAnchorPos(newAnchors, -imageSet.rotation);
        onUpdateAnchor(corrected);
      } else {
        onUpdateAnchor(newAnchors);
      }
    },
    [imageSet.rotation, onUpdateAnchor]
  );

  const { onDragStart, onDragEnd, onCircleDragEnd } = useImageAnchor({
    imageSet,
    onUpdateAnchor: onUpdateAnchorWrapper,
  });

  // 選択時の処理（ドラッグ有効化など）
  const onMouseDown = useCallback(() => {
    // ドラッグボタンを上書きし、ドラッグ有効化
    Konva.dragButtons = [0];
    if (lineRef.current) lineRef.current.draggable(true);
    if (ltRef.current) ltRef.current.draggable(true);
    if (lbRef.current) lbRef.current.draggable(true);
    if (rtRef.current) rtRef.current.draggable(true);
    if (rbRef.current) rbRef.current.draggable(true);
  }, []);

  const circleDragHandler = onCircleDragEnd(ltRef, lbRef, rtRef, rbRef);

  // アンカー位置の同期
  useLayoutEffect(() => {
    if (imageSet.current_anchor_pos) {
      // 表示用に回転させたアンカーを計算
      const displayedAnchors = imageSet.rotation
        ? rotateAnchorPos(imageSet.current_anchor_pos, imageSet.rotation)
        : imageSet.current_anchor_pos;

      if (ltRef.current && lbRef.current && rtRef.current && rbRef.current) {
        const apply = (ref: Konva.Circle, pos: { x: number; y: number }) => {
          ref.x(pos.x);
          ref.y(pos.y);
        };
        apply(ltRef.current, displayedAnchors.lt);
        apply(lbRef.current, displayedAnchors.lb);
        apply(rtRef.current, displayedAnchors.rt);
        apply(rbRef.current, displayedAnchors.rb);
      }
      if (lineRef.current) {
        // ラインの頂点を更新
        lineRef.current.points([
          displayedAnchors.lt.x,
          displayedAnchors.lt.y,
          displayedAnchors.lb.x,
          displayedAnchors.lb.y,
          displayedAnchors.rb.x,
          displayedAnchors.rb.y,
          displayedAnchors.rt.x,
          displayedAnchors.rt.y,
          displayedAnchors.lt.x,
          displayedAnchors.lt.y,
        ]);
        // 内部変換をリセット
        lineRef.current.scaleX(1);
        lineRef.current.scaleY(1);
        lineRef.current.x(0);
        lineRef.current.y(0);
      }
    }
  }, [imageSet]);

  return (
    <>
      <Line
        ref={lineRef}
        closed={true}
        stroke={"#4e4eff"}
        strokeWidth={3}
        onMouseDown={onMouseDown}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
      {cRefs.map((ref, index) => (
        <Circle
          key={index}
          draggable={false} // onMouseDownでtrueにする
          onMouseDown={onMouseDown}
          onDragEnd={circleDragHandler}
          ref={ref}
          radius={15}
          stroke="#1919eb"
          fill="#4e4eff"
        />
      ))}
    </>
  );
};
