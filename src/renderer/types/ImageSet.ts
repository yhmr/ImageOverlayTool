import { AnchorPos } from "./AnchorPos";

// 画像セットの型
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
