import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { e2eIpcContracts } from "../../../shared/ipc/contracts";
import type { E2ECaptureRequest } from "../../../shared/types/E2EControl";
import { captureWindowAreaAndSave } from "../../services/captureService";
import type { E2EControlHandlerContext } from "./types";

export const registerE2ECaptureHandlers = (
    context: E2EControlHandlerContext
): void => {
    ipcMain.handle(
        e2eIpcContracts.capture.channel,
        async (event: IpcMainInvokeEvent, request?: E2ECaptureRequest) => {
            context.assertControlPlaneEnabled();
            const mode = request?.mode ?? "window";
            if (mode === "screen") {
                return captureWindowAreaAndSave(
                    event,
                    true,
                    context.captureTestMode
                );
            }
            return captureWindowAreaAndSave(
                event,
                false,
                context.captureTestMode
            );
        }
    );
};
