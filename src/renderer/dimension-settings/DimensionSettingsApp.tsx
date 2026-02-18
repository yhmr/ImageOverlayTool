import React from "react";
import ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";

import "../../i18n/configs";
import { normalizeLanguage } from "../../i18n/languages";
import { MIN_DIMENSION_SETTINGS_WINDOW_SIZE } from "../../shared/types/AppConfig";
import "../shared/globals.css";
import "./DimensionSettingsApp.css";

import { useProjectDataSyncBridge } from "../hooks/useProjectDataSyncBridge";
import { useProjectSync } from "../hooks/useProjectSync";
import { useE2EControlBridge } from "../hooks/useE2EControlBridge";
import {
    IpcServiceProvider,
    useIpcService,
} from "../providers/IpcServiceProvider";
import { WindowResizeHandles } from "../main-window/components/WindowResizeHandles";
import { DimensionSettingsMenuBar } from "./components/DimensionSettingsMenuBar";
import { DimensionLineSettingsPanel } from "./components/DimensionLineSettingsPanel";

const DimensionSettingsApp = () => {
    const ipcService = useIpcService();
    const { i18n } = useTranslation();

    useProjectDataSyncBridge();
    useProjectSync();
    useE2EControlBridge();

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
                    "DimensionSettings language initialization failed:",
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

    React.useEffect(() => {
        void ipcService.requestInitialState();
    }, [ipcService]);

    return (
        <div
            className="dimension-settings-container bg-background text-foreground"
            data-testid="dimension-settings.app.root"
        >
            <DimensionSettingsMenuBar />
            <div className="dimension-settings-content">
                <DimensionLineSettingsPanel />
            </div>
            <WindowResizeHandles
                testIdPrefix="dimension-settings"
                minWidth={MIN_DIMENSION_SETTINGS_WINDOW_SIZE.width}
                minHeight={MIN_DIMENSION_SETTINGS_WINDOW_SIZE.height}
            />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <IpcServiceProvider>
            <DimensionSettingsApp />
        </IpcServiceProvider>
    </React.StrictMode>
);
