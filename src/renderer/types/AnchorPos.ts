import { Point } from "../../shared/types/Point";

// 画像アンカーポイントの型
export interface AnchorPos {
    lt: Point; // Left Top
    lb: Point; // Left Bottom
    rt: Point; // Right Top
    rb: Point; // Right Bottom
}
