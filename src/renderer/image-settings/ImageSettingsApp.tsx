import "../shared/globals.css";
import React from "react";
import ReactDOM from "react-dom/client";
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

import { useProjectSync } from "../hooks/useProjectSync";
import { useProjectDataSyncBridge } from "../hooks/useProjectDataSyncBridge";
import "../../i18n/configs";

import { SettingsMenuBar } from "./components/SettingsMenuBar";
import { ImageList } from "./components/ImageList";

import "./ImageSettingsApp.css";

const ImageSettingsApp = () => {
    // ローカル編集を他ウィンドウへ同期
    useProjectDataSyncBridge();
    // 同期フックを使用
    useProjectSync();

    // マウント時に初期状態を要求
    React.useEffect(() => {
        getIPCService().requestInitialState();
    }, []);

    return (
        <>
            <div className="settings-container bg-background text-foreground">
                <SettingsMenuBar />
                <div className="settings-content">
                    <ImageList />
                </div>
            </div>
        </>
    );
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ImageSettingsApp />
    </React.StrictMode>
);
