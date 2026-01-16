import "../shared/globals.css";
import React from "react";
import ReactDOM from "react-dom/client";

import { useProjectSync } from "../hooks/useProjectSync";
import "../../i18n/configs";

import { SettingsMenuBar } from "./components/SettingsMenuBar";
import { ImageList } from "./components/ImageList";

import "./ImageSettingsApp.css";

const ImageSettingsApp = () => {
    // 同期フックを使用
    useProjectSync();

    // マウント時に初期状態を要求
    React.useEffect(() => {
        window.electronAPI.requestInitialState();
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
