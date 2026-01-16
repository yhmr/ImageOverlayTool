import React, { useCallback, useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";

import { useAppStore } from "../store/useAppStore";
import { useProjectSync } from "../hooks/useProjectSync";
import { useFileHandler } from "../hooks/useFileHandler";
import "../../i18n/configs"; //i18

import "../shared/globals.css";
import "./App.css";
import { MenuBar } from "./components/MenuBar";
import { ImageStage } from "./components/ImageStage";
import { ContextMenu } from "./components/ContextMenu";
import { logger } from "../services/loggerService";

// グローバルエラーハンドリング
window.addEventListener("error", (event) => {
    logger.error("Renderer Uncaught Error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
    logger.error("Renderer Unhandled Rejection:", event.reason);
});

const App = () => {
    // 設定の読み込み
    const { windowColor, setWindowColor } = useAppStore();

    // 同期フックを使用
    useProjectSync();
    // ファイルハンドラフックを使用 (起動時引数など)
    useFileHandler();

    // 初めの一度のみ描画前にファイルから色を取得
    useLayoutEffect(() => {
        // 設定を読み込み
        const loadColor = async () => {
            const color = await window.electronAPI.loadWindowColor();
            setWindowColor(color);
        };
        loadColor();
    }, [setWindowColor]);

    // 色設定完了時にファイルに色を保存
    const onCompleteColor = useCallback(async () => {
        await window.electronAPI.saveWindowColor(windowColor);
    }, [windowColor]);

    // 色設定の変更
    const handleSetColor = useCallback(
        (color: string) => {
            setWindowColor(color);
        },
        [setWindowColor]
    );

    return (
        <div className="container">
            <MenuBar />
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: windowColor,
                }}
            >
                <div className="image-area">
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
