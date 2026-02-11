import React, { useEffect, useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";

import "../../i18n/configs"; //i18
import "../shared/globals.css";
import "./App.css";

import { useFileHandler } from "../hooks/useFileHandler";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useProjectDataSyncBridge } from "../hooks/useProjectDataSyncBridge";
import { useProjectSync } from "../hooks/useProjectSync";
import {
    IpcServiceProvider,
    useIpcService,
} from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";
import { ContextMenu } from "./components/ContextMenu";
import { ImageStage } from "./components/ImageStage";
import { MenuBar } from "./components/MenuBar";

const App = () => {
    // 設定の読み込み
    const { windowColor, setWindowColor } = useAppStore();
    const ipcService = useIpcService();

    // ローカル編集を他ウィンドウへ同期
    useProjectDataSyncBridge();
    // 同期フックを使用
    useProjectSync();
    // ファイルハンドラフックを使用 (起動時引数など)
    useFileHandler();
    // キーボードショートカット (Undo/Redo)
    useKeyboardShortcuts();

    // グローバルエラーハンドリング
    useEffect(() => {
        const onError = (event: ErrorEvent) => {
            void ipcService.log.error(
                "Renderer Uncaught Error:",
                event.error || event.message
            );
        };

        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            void ipcService.log.error(
                "Renderer Unhandled Rejection:",
                event.reason
            );
        };

        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onUnhandledRejection);

        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener(
                "unhandledrejection",
                onUnhandledRejection
            );
        };
    }, [ipcService]);

    // 初めの一度のみ描画前にファイルから色を取得
    useLayoutEffect(() => {
        // 設定を読み込み
        const loadColor = async () => {
            const color = await ipcService.loadWindowColor();
            setWindowColor(color);
            // 初期設定による変更なので履歴をクリアする
            useAppStore.temporal.getState().clear();
        };
        void loadColor();
    }, [setWindowColor, ipcService]);

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
                    <ContextMenu>
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
        <IpcServiceProvider>
            <App />
        </IpcServiceProvider>
    </React.StrictMode>
);
