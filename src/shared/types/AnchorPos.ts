import { Point } from "./Point";

/**
 * 画像アンカーポイントの型
 * 4隅の頂点座標を定義する
 */
export interface AnchorPos {
    lt: Point; // Left Top
    lb: Point; // Left Bottom
    rt: Point; // Right Top
    rb: Point; // Right Bottom
}
