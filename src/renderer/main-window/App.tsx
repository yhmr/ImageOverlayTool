import React, { useCallback, useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";

import { useAppStore } from "../store/useAppStore";
import { useProjectSync } from "../hooks/useProjectSync";
import { useProjectDataSyncBridge } from "../hooks/useProjectDataSyncBridge";
import { useFileHandler } from "../hooks/useFileHandler";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import "../../i18n/configs"; //i18

import "../shared/globals.css";
import "./App.css";
import { MenuBar } from "./components/MenuBar";
import { ImageStage } from "./components/ImageStage";
import { ContextMenu } from "./components/ContextMenu";
import { getIPCService } from "../services/ipcService";

// グローバルエラーハンドリング

window.addEventListener("error", (event) => {
    getIPCService().log.error(
        "Renderer Uncaught Error:",
        event.error || event.message
    );
});

window.addEventListener("unhandledrejection", (event) => {
    getIPCService().log.error("Renderer Unhandled Rejection:", event.reason);
});

const App = () => {
    // 設定の読み込み
    const { windowColor, setWindowColor } = useAppStore();
    const ipcService = getIPCService();

    // ローカル編集を他ウィンドウへ同期
    useProjectDataSyncBridge();
    // 同期フックを使用
    useProjectSync();
    // ファイルハンドラフックを使用 (起動時引数など)
    useFileHandler();
    // キーボードショートカット (Undo/Redo)
    useKeyboardShortcuts();

    // 初めの一度のみ描画前にファイルから色を取得
    useLayoutEffect(() => {
        // 設定を読み込み
        const loadColor = async () => {
            const color = await ipcService.loadWindowColor();
            setWindowColor(color);
            // 初期設定による変更なので履歴をクリアする
            useAppStore.temporal.getState().clear();
        };
        loadColor();
    }, [setWindowColor, ipcService]);

    // 色設定完了時にファイルに色を保存
    const onCompleteColor = useCallback(async () => {
        await ipcService.saveWindowColor(windowColor);
    }, [windowColor, ipcService]);

    // 色設定の変更
    const handleSetColor = useCallback(
        (color: string) => {
            setWindowColor(color);
        },
        [setWindowColor]
    );

    return (
        <div className="main-app-container" data-testid="main.app.root">
            <MenuBar />
            <div
                style={{
                    width: "100%",
                    flexGrow: 1,
                    backgroundColor: windowColor,
                    overflow: "hidden",
                }}
            >
                <div className="image-area" data-testid="main.canvas.area">
                    <ContextMenu
                        color={windowColor}
                        setColor={handleSetColor}
                        onComplete={onCompleteColor}
                    >
                        <ImageStage />
                    </ContextMenu>
                </div>
            </div>
        </div>
    );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
