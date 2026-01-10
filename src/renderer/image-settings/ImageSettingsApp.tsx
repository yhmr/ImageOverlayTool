import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { store } from "../store/store";
import { useImageSetsSync } from "../hooks/useImageSetsSync";
import "../../i18n/configs";

import { CssBaseline } from "@mui/material";

import { SettingsMenuBar } from "./components/SettingsMenuBar";
import { ImageList } from "./components/ImageList";

import "./ImageSettingsApp.css";

const ImageSettingsApp = () => {
    // 画像同期フックを使用
    useImageSetsSync();

    return (
        <>
            <CssBaseline />
            <div className="settings-container">
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
        <Provider store={store}>
            <ImageSettingsApp />
        </Provider>
    </React.StrictMode>
);
