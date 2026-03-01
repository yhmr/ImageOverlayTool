import React, { type ErrorInfo } from "react";
import ReactDOM from "react-dom/client";

import "../../i18n/configs"; //i18
import "../shared/globals.css";
import "./App.css";

import { useFileHandler } from "./hooks/useFileHandler";
import { useImageDrop } from "../hooks/useImageDrop";
import { useBroadcastProjectData } from "../hooks/useBroadcastProjectData";
import { useMainWindowDialogState } from "./hooks/useMainWindowDialogState";
import { useReceiveProjectData } from "../hooks/useReceiveProjectData";
import { useRespondProjectDataSyncRequest } from "../hooks/useRespondProjectDataSyncRequest";
import {
    IpcServiceProvider,
    useIpcService,
} from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";
import {
    selectIsWindowFrameVisible,
    selectWindowColor,
} from "../store/selectors";
import { ImageStage } from "./components/ImageStage";
import { MenuBar } from "./components/MenuBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { WindowResizeHandles } from "./components/WindowResizeHandles";
import { useMainWindowActions } from "./hooks/useMainWindowActions";
import { ColorPicker } from "./components/ColorPicker";
import { useGlobalErrorLogging } from "./hooks/useGlobalErrorLogging";
import { useMainWindowBootstrap } from "./hooks/useMainWindowBootstrap";
import { useWindowColorPickerController } from "./hooks/useWindowColorPickerController";

const App = () => {
    const isWindowFrameVisible = useAppStore(selectIsWindowFrameVisible);
    const windowColor = useAppStore(selectWindowColor);
    const mainWindowActions = useMainWindowActions();
    const windowColorPicker = useWindowColorPickerController();
    const {
        isImageExportDialogOpen,
        openImageExportDialog,
        closeImageExportDialog,
    } = useMainWindowDialogState();

    // ローカル編集を他ウィンドウへ同期
    useBroadcastProjectData();
    // 同期データの受信
    useReceiveProjectData();
    // 同期要求に対する現在状態の応答
    useRespondProjectDataSyncRequest();
    // ファイルハンドラフックを使用 (起動時引数など)
    useFileHandler();
    useGlobalErrorLogging();
    useMainWindowBootstrap();
    // D&D画像読み込み
    const { onDragOver, onDrop } = useImageDrop();

    const handleApplyPresetColor = (index: number) => {
        if (windowColorPicker.presets.length > index) {
            windowColorPicker.applyColor(windowColorPicker.presets[index]);
        }
    };

    return (
        <div
            className="main-app-container"
            data-testid="main.app.root"
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <MenuBar
                onOpenImageExportDialog={openImageExportDialog}
                onOpenWindowColorPicker={windowColorPicker.open}
                onApplyPresetColor={handleApplyPresetColor}
                mainWindowActions={mainWindowActions}
            />
            <div
                style={{
                    width: "100%",
                    flexGrow: 1,
                    backgroundColor: windowColor,
                    overflow: "hidden",
                }}
            >
                <div
                    className="image-area"
                    data-testid="main.canvas.area"
                    data-clickthrough-target
                >
                    <ImageStage
                        isImageExportDialogOpen={isImageExportDialogOpen}
                        onOpenImageExportDialog={openImageExportDialog}
                        onCloseImageExportDialog={closeImageExportDialog}
                        onOpenWindowColorPicker={windowColorPicker.open}
                        mainWindowActions={mainWindowActions}
                    />
                </div>
            </div>
            <ColorPicker
                isOpen={windowColorPicker.isPickerOpen}
                onOpenChange={windowColorPicker.setPickerOpen}
                color={windowColorPicker.windowColor}
                onColorChange={(color) =>
                    windowColorPicker.applyColor(color, false)
                }
                onColorChangeComplete={() =>
                    windowColorPicker.applyColor(
                        windowColorPicker.windowColor,
                        true
                    )
                }
                centerOnScreen
                presets={windowColorPicker.presets}
                onAddPreset={windowColorPicker.addPreset}
                onRemovePreset={windowColorPicker.removePreset}
                onUpdatePreset={windowColorPicker.updatePreset}
            />
            <WindowResizeHandles showFrameBorder={isWindowFrameVisible} />
        </div>
    );
};

const AppWithErrorBoundary = () => {
    const ipcService = useIpcService();

    const handleBoundaryError = (
        error: unknown,
        errorInfo?: ErrorInfo | null
    ) => {
        void ipcService.log.error("Renderer ErrorBoundary caught error", {
            error,
            componentStack: errorInfo?.componentStack,
        });
    };

    return (
        <ErrorBoundary onError={handleBoundaryError}>
            <App />
        </ErrorBoundary>
    );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <IpcServiceProvider>
            <AppWithErrorBoundary />
        </IpcServiceProvider>
    </React.StrictMode>
);
