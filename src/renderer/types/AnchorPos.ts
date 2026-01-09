// 画像アンカーポイントの型
export interface AnchorPos {
  lt: Point; // Left Top
  lb: Point; // Left Bottom
  rt: Point; // Right Top
  rb: Point; // Right Bottom
}

// 2Dポイントの型
export interface Point {
  x: number;
  y: number;
}
