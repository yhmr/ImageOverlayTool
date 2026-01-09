import { app, screen } from "electron";
import Store from "electron-store";
import { AppConfig, DEFAULT_SIZE } from "../../renderer/types/AppConfig";
import { calcCenterPosition } from "../utils/calcCenterPosition";
import type { Point } from "../../renderer/types/Point";
import type { Size } from "../../renderer/types/Size";

// 設定ファイル用のStoreを作成して返却
export function CreateConfigStore(): Store<AppConfig> {
  return new Store<AppConfig>({
    cwd: app.getPath("userData"), // 保存先のディレクトリ
    name: "app.config", // ファイル名
    fileExtension: "json", // 拡張子
  });
}

// ウィンドウの位置とサイズを取得
export function getWindowPositionAndSize(store: Store<AppConfig>): { pos: Point; size: Size } {
  const [x, y] = store.get("window.pos", getDefaultCenterPosition());
  const [width, height] = store.get("window.size", [
    DEFAULT_SIZE.width,
    DEFAULT_SIZE.height,
  ]);

  return {
    pos: { x, y },
    size: { width, height }
  };
}

/**
 * ウィンドウの中央の座標を返却
 */
function getDefaultCenterPosition() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return calcCenterPosition(
    { width, height },
    { width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height }
  );
}