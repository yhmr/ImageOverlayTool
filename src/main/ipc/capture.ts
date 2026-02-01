import {
    ipcMain,
    desktopCapturer,
    screen,
    BrowserWindow,
    dialog,
    app,
    IpcMainInvokeEvent,
} from "electron";
import fs from "fs/promises";
import path from "path";
import log from "../logger";

export const registerCaptureHandlers = (): void => {
    ipcMain.handle("capture-screen", async (event: IpcMainInvokeEvent) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return null;

        // 1. ウィンドウ位置・サイズの取得 (ピクセル単位)
        const winBounds = win.getBounds();
        const display = screen.getDisplayMatching(winBounds);

        // 2. ウィンドウを一時的に隠す
        const allWindows = BrowserWindow.getAllWindows();
        const visibleWindows = allWindows.filter((w) => w.isVisible());
        visibleWindows.forEach((w) => w.hide());

        try {
            // アニメーション完了待ち
            await new Promise((resolve) => setTimeout(resolve, 300));

            // 3. スクリーンキャプチャ
            // getSourcesで取得できるサムネイルのサイズはデフォルトだと小さいので、
            // ディスプレイ解像度に合わせる必要がある。
            // display.size はDIP単位なので、scaleFactorを掛ける
            const thumbnailSize = {
                width: display.size.width * display.scaleFactor,
                height: display.size.height * display.scaleFactor,
            };

            const sources = await desktopCapturer.getSources({
                types: ["screen"],
                thumbnailSize: thumbnailSize,
            });

            // display.id と一致する source を検索
            // Electronのsource.display_id は文字列。display.id は数値の場合がある。
            let source = sources.find(
                (s) => s.display_id === display.id.toString()
            );

            // 見つからない場合のフォールバック（シングルモニタ等）
            if (!source && sources.length > 0) {
                // ディスプレイが1つならそれを採用
                if (sources.length === 1) {
                    source = sources[0];
                } else {
                    // 複数あるがID一致しない場合、とりあえず0番目（プライマリ?）なことが多いが
                    // 確実ではないためログを出力して先頭を使う
                    log.warn(
                        "Could not match display id, using first source.",
                        display.id,
                        sources.map((s) => s.display_id)
                    );
                    source = sources[0];
                }
            }

            if (!source) {
                throw new Error("No display source found for capture.");
            }

            const screenshot = source.thumbnail;

            // 4. クロップ処理
            // スクリーンショット画像はディスプレイ全領域(物理ピクセル)を持つはず。
            // ウィンドウの座標(DIP)を物理ピクセルに変換してクロップする。

            // ディスプレイ左上からの相対座標 (DIP)
            const relativeX_DIP = winBounds.x - display.bounds.x;
            const relativeY_DIP = winBounds.y - display.bounds.y;

            // 物理ピクセルに変換
            const scale = display.scaleFactor;
            const cropX = Math.round(relativeX_DIP * scale);
            const cropY = Math.round(relativeY_DIP * scale);
            const cropW = Math.round(winBounds.width * scale);
            const cropH = Math.round(winBounds.height * scale);

            // 返却用のDIPサイズ（正確には、画像の論理サイズとして扱うべき値）
            // キャプチャ画像はウィンドウ全体と一致するため、ウィンドウサイズ(DIP)そのままで良いはずだが、
            // 念のためクロップサイズからスケールを戻した値を計算しておく
            const resultWidth = cropW / scale;
            const resultHeight = cropH / scale;

            // 画像範囲外にならないように補正（念のため）

            const cropped = screenshot.crop({
                x: cropX,
                y: cropY,
                width: cropW,
                height: cropH,
            });

            // 5. ウィンドウ復帰
            visibleWindows.forEach((w) => w.show());
            if (win.isMinimized()) win.restore();
            win.focus();

            // 6. 保存ダイアログ
            const { filePath } = await dialog.showSaveDialog(win, {
                title: "Save Capture",
                defaultPath: path.join(
                    app.getPath("pictures"),
                    `capture_${Date.now()}.png`
                ),
                filters: [{ name: "PNG Images", extensions: ["png"] }],
            });

            if (filePath) {
                await fs.writeFile(filePath, cropped.toPNG());
                return {
                    filePath,
                    width: resultWidth,
                    height: resultHeight,
                };
            }

            return null;
        } catch (error) {
            log.error("Screen capture failed:", error);
            // 失敗時もウィンドウは戻す
            visibleWindows.forEach((w) => w.show());
            if (win.isMinimized()) win.restore();
            win.focus();
            throw error;
        }
    });
};
