import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useCallbackRef } from "use-callback-ref";

import useImage from "use-image";
import Konva from "konva";
import { Circle, Line } from "react-konva";
import { Html } from "react-konva-utils";

import Perspective from "perspectivets";

import { AnchorPos, ImageSet, Point } from "../types/ImageSet";

// Konva.Imageはperspective変換に対応していないため、
// Canvas要素を直接Konva.Stageに埋め込む対応を取っている
// そのため、実際にこのコンポーネントで記述する要素は
//   <Canvas> : 画像表示用
//   <Konva.Line> : ドラッグや選択を制御する透明ポリゴン
//   <Konva.Circle> : 変形のためのCircle

interface DrawImageProps {
  imageSet: ImageSet;
  onInitImage: (image: HTMLImageElement) => void;
  onUpdateAnchor: (anchorPos: AnchorPos) => void;
  isSelected: boolean;
  onSelect: () => void;
}
export const DrawImage = (props: DrawImageProps) => {
  const { imageSet, onInitImage, onUpdateAnchor, isSelected, onSelect } = props;

  // useCallbackRefで必要
  const [, forceUpdate] = useState(false);

  // ref
  const ltRef = useRef<Konva.Circle>(null);
  const lbRef = useRef<Konva.Circle>(null);
  const rtRef = useRef<Konva.Circle>(null);
  const rbRef = useRef<Konva.Circle>(null);
  const lineRef = useRef<Konva.Line>(null);
  const canvasRef = useCallbackRef<HTMLCanvasElement>(null, () =>
    forceUpdate((state) => !state)
  );
  // 描画用にまとめる
  const cRefs = [ltRef, lbRef, rtRef, rbRef];

  // 画像
  const [image] = useImage(imageSet.path);

  // クリック時
  const onMouseDown = useCallback(() => {
    if (isSelected) {
      // ドラッグボタンを上書きし、ドラッグ有効化
      Konva.dragButtons = [0];
      if (lineRef && lineRef.current) {
        lineRef.current.draggable(true);
      }
      if (
        ltRef &&
        ltRef.current &&
        lbRef &&
        lbRef.current &&
        rtRef &&
        rtRef.current &&
        rbRef &&
        rbRef.current
      ) {
        ltRef.current.draggable(true);
        lbRef.current.draggable(true);
        rtRef.current.draggable(true);
        rbRef.current.draggable(true);
      }
    }
  }, [isSelected, lineRef, ltRef, lbRef, rtRef, rbRef]);

  // ドラッグ開始
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });
  const onDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setDragStartPos({ x: e.target.x(), y: e.target.y() });
  }, []);
  // ドラッグ終了
  const onDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (isSelected && imageSet.current_anchor_pos) {
        // 移動距離を計算
        const diffX = e.target.x() - dragStartPos.x;
        const diffY = e.target.y() - dragStartPos.y;

        const newAnchor = {
          lt: {
            x: imageSet.current_anchor_pos.lt.x + diffX,
            y: imageSet.current_anchor_pos.lt.y + diffY,
          },
          lb: {
            x: imageSet.current_anchor_pos.lb.x + diffX,
            y: imageSet.current_anchor_pos.lb.y + diffY,
          },
          rt: {
            x: imageSet.current_anchor_pos.rt.x + diffX,
            y: imageSet.current_anchor_pos.rt.y + diffY,
          },
          rb: {
            x: imageSet.current_anchor_pos.rb.x + diffX,
            y: imageSet.current_anchor_pos.rb.y + diffY,
          },
        };
        // 親でpropを更新
        onUpdateAnchor(newAnchor);
      }
    },
    [isSelected, imageSet, dragStartPos, onUpdateAnchor]
  );

  // Select時
  // select自体でもleft button downなので、ドラッグ判定を更新
  const onClick = useCallback(() => {
    // ドラッグボタンを上書きし、ドラッグ有効化
    Konva.dragButtons = [0];
    onSelect();
  }, [onSelect]);

  // アンカーのドラッグ終了
  const onCircleDragEnd = useCallback(
    (ref: React.RefObject<Konva.Circle>) => {
      return (e: Konva.KonvaEventObject<DragEvent>) => {
        if (ref.current) {
          // ポジションを取得
          ref.current.x(e.target.x());
          ref.current.y(e.target.y());

          if (
            ltRef &&
            ltRef.current &&
            lbRef &&
            lbRef.current &&
            rtRef &&
            rtRef.current &&
            rbRef &&
            rbRef.current
          ) {
            // ref => current_anchor
            const newAnchor = {
              lt: {
                x: ltRef.current.x(),
                y: ltRef.current.y(),
              },
              lb: {
                x: lbRef.current.x(),
                y: lbRef.current.y(),
              },
              rt: {
                x: rtRef.current.x(),
                y: rtRef.current.y(),
              },
              rb: {
                x: rbRef.current.x(),
                y: rbRef.current.y(),
              },
            };
            onUpdateAnchor(newAnchor);
          }
        }
      };
    },
    [onUpdateAnchor]
  );

  // anchor_posのエリア情報を取得する
  const GetAreaProfile = useCallback(() => {
    if (imageSet && imageSet.current_anchor_pos) {
      const xMin = Math.min(
        imageSet.current_anchor_pos.lt.x,
        imageSet.current_anchor_pos.lb.x,
        imageSet.current_anchor_pos.rt.x,
        imageSet.current_anchor_pos.rb.x
      );
      const xMax = Math.max(
        imageSet.current_anchor_pos.lt.x,
        imageSet.current_anchor_pos.lb.x,
        imageSet.current_anchor_pos.rt.x,
        imageSet.current_anchor_pos.rb.x
      );
      const yMin = Math.min(
        imageSet.current_anchor_pos.lt.y,
        imageSet.current_anchor_pos.lb.y,
        imageSet.current_anchor_pos.rt.y,
        imageSet.current_anchor_pos.rb.y
      );
      const yMax = Math.max(
        imageSet.current_anchor_pos.lt.y,
        imageSet.current_anchor_pos.lb.y,
        imageSet.current_anchor_pos.rt.y,
        imageSet.current_anchor_pos.rb.y
      );

      return {
        left: xMin,
        top: yMin,
        right: xMax,
        bottom: yMax,
      };
    } else {
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }
  }, [imageSet]);

  // ImageSetの関連初期化
  useLayoutEffect(() => {
    // 画像読み込み完了時、初期imageSetなら
    if (image && (!imageSet.init_anchor_pos || !imageSet.current_anchor_pos)) {
      onInitImage(image);
    }
  });

  // anchorの描画
  // current_anchor => ref
  useLayoutEffect(() => {
    if (imageSet.current_anchor_pos) {
      if (
        isSelected &&
        ltRef &&
        ltRef.current &&
        lbRef &&
        lbRef.current &&
        rtRef &&
        rtRef.current &&
        rbRef &&
        rbRef.current
      ) {
        // current anchorの位置にcircleを描画
        // circleはselected時のみ
        const apply = (ref: Konva.Circle, pos: Point) => {
          ref.x(pos.x);
          ref.y(pos.y);
        };
        apply(ltRef.current, imageSet.current_anchor_pos.lt);
        apply(lbRef.current, imageSet.current_anchor_pos.lb);
        apply(rtRef.current, imageSet.current_anchor_pos.rt);
        apply(rbRef.current, imageSet.current_anchor_pos.rb);
      }
      if (lineRef && lineRef.current) {
        // current anchorの位置にlineを描画
        lineRef.current.points([
          imageSet.current_anchor_pos.lt.x,
          imageSet.current_anchor_pos.lt.y,
          imageSet.current_anchor_pos.lb.x,
          imageSet.current_anchor_pos.lb.y,
          imageSet.current_anchor_pos.rb.x,
          imageSet.current_anchor_pos.rb.y,
          imageSet.current_anchor_pos.rt.x,
          imageSet.current_anchor_pos.rt.y,
          imageSet.current_anchor_pos.lt.x,
          imageSet.current_anchor_pos.lt.y,
        ]);
        lineRef.current.scaleX(1);
        lineRef.current.scaleY(1);
        lineRef.current.x(0);
        lineRef.current.y(0);
      }
    }
  }, [image, imageSet, isSelected, ltRef, lbRef, rtRef, rbRef]);

  useEffect(() => {
    if (image && imageSet.current_anchor_pos && canvasRef.current) {
      // Homography処理
      const cnv = canvasRef.current;
      // Left/Topは左上固定
      cnv.style.position = "absolute";
      const { left, top, right, bottom } = GetAreaProfile();
      cnv.width = right - left;
      cnv.height = bottom - top;
      cnv.style.left = `${left}px`;
      cnv.style.top = `${top}px`;
      cnv.style.zIndex = "0";
      cnv.style.pointerEvents = "none";
      const ctx = cnv.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        // クリア
        ctx.clearRect(0, 0, cnv.width, cnv.height);
        // 透過率
        ctx.globalAlpha = 1.0 - imageSet.transparency;
        // 変形後の図形を記述
        const p = new Perspective(ctx, image);
        p.draw({
          topLeftX: imageSet.current_anchor_pos.lt.x - left,
          topLeftY: imageSet.current_anchor_pos.lt.y - top,
          topRightX: imageSet.current_anchor_pos.rt.x - left,
          topRightY: imageSet.current_anchor_pos.rt.y - top,
          bottomRightX: imageSet.current_anchor_pos.rb.x - left,
          bottomRightY: imageSet.current_anchor_pos.rb.y - top,
          bottomLeftX: imageSet.current_anchor_pos.lb.x - left,
          bottomLeftY: imageSet.current_anchor_pos.lb.y - top,
        });
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, imageSet, canvasRef.current, GetAreaProfile]);

  return (
    <>
      {image && image !== undefined && (
        <>
          {/* konvaにcanvasを埋め込む.クリックは無視 */}
          <Html divProps={{ style: { pointerEvents: "none" } }}>
            <canvas ref={canvasRef} />
          </Html>
          {/* クリック判定維持のためLineは常に描画 */}
          <Line
            ref={lineRef}
            closed={true}
            stroke={isSelected ? "#4e4eff" : "#00000000"}
            strokeWidth={3}
            onMouseDown={onMouseDown}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
          />
          {isSelected &&
            cRefs.map((ref, index) => {
              return (
                <Circle
                  key={index}
                  draggable={false}
                  onMouseDown={onMouseDown}
                  onDragEnd={onCircleDragEnd(ref)}
                  ref={ref}
                  radius={15}
                  stroke="#1919eb"
                  fill="#4e4eff"
                />
              );
            })}
        </>
      )}
    </>
  );
};
