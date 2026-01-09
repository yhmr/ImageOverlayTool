export interface ImageSet {
  // id
  id: string;
  // 画像パス
  path: string;
  // 透過度
  transparency: number;

  // アンカー初期ポジジョン
  init_anchor_pos: AnchorPos | null;
  // アンカー現在のポジション
  current_anchor_pos: AnchorPos | null;
}

export interface AnchorPos {
  lt: Point; // Left Top
  lb: Point; // Left Bottom
  rt: Point; // Right Top
  rb: Point; // Right Bottom
}

export interface Point {
  x: number;
  y: number;
}
