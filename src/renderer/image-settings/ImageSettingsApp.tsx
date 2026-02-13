import React from "react";
import ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";

import "../../i18n/configs";
import { normalizeLanguage } from "../../i18n/languages";
import "../shared/globals.css";
import "./ImageSettingsApp.css";

import { useProjectDataSyncBridge } from "../hooks/useProjectDataSyncBridge";
import { useProjectSync } from "../hooks/useProjectSync";
import {
    IpcServiceProvider,
    useIpcService,
} from "../providers/IpcServiceProvider";
import { ImageList } from "./components/ImageList";
import { SettingsMenuBar } from "./components/SettingsMenuBar";

const ImageSettingsApp = () => {
    const ipcService = useIpcService();
    const { i18n } = useTranslation();

    // ローカル編集を他ウィンドウへ同期
    useProjectDataSyncBridge();
    // 同期フックを使用
    useProjectSync();

    React.useEffect(() => {
        let isMounted = true;
        const applyLanguage = async () => {
            try {
                const setting = await ipcService.loadSetting();
                if (!isMounted) {
                    return;
                }
                await i18n.changeLanguage(normalizeLanguage(setting.language));
            } catch (error) {
                void ipcService.log.error(
                    "ImageSettings language initialization failed:",
                    error
                );
            }
        };

        void applyLanguage();
        const unsubscribe = ipcService.onLanguageUpdated((language) => {
            void i18n.changeLanguage(normalizeLanguage(language));
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [i18n, ipcService]);

    // グローバルエラーハンドリング
    React.useEffect(() => {
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

    // マウント時に初期状態を要求
    React.useEffect(() => {
        void ipcService.requestInitialState();
    }, [ipcService]);

    return (
        <div className="settings-container bg-background text-foreground">
            <SettingsMenuBar />
            <div className="settings-content">
                <ImageList />
            </div>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <IpcServiceProvider>
            <ImageSettingsApp />
        </IpcServiceProvider>
    </React.StrictMode>
);
