import { ipcMain } from "electron";
import { e2eIpcContracts } from "../../../shared/ipc/contracts";
import type {
    E2EControlStatus,
    E2EWaitStableResult,
} from "../../../shared/types/E2EControl";
import type { E2EControlHandlerContext } from "./types";

export const registerE2EStatusHandlers = (
    context: E2EControlHandlerContext
): void => {
    ipcMain.handle(e2eIpcContracts.getStatus.channel, (): E2EControlStatus => {
        const enabled = context.isControlPlaneEnabled();
        return {
            enabled,
            artifactsDir: context.e2eConfig.artifactsDir,
            fixturesDir: context.e2eConfig.fixturesDir,
            reason: enabled ? undefined : context.getDisabledReason(),
        };
    });

    ipcMain.handle(
        e2eIpcContracts.waitStable.channel,
        (): E2EWaitStableResult => {
            context.assertControlPlaneEnabled();
            return {
                stable: true,
                elapsedMs: 0,
            };
        }
    );
};
