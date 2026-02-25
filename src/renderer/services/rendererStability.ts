import type {
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../shared/types/E2EControl";
import { useAppStore } from "../store/useAppStore";

const POLL_INTERVAL_MS = 16;
const DEFAULT_STABLE_TIMEOUT_MS = 5000;

const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const isRendererStable = (): boolean => {
    const { imageSets } = useAppStore.getState();
    return imageSets.every((imageSet) => {
        if (!imageSet.path) {
            return true;
        }
        return Boolean(imageSet.initAnchorPos && imageSet.currentAnchorPos);
    });
};

export const waitForRendererStable = async (
    request?: E2EWaitStableRequest
): Promise<E2EWaitStableResult> => {
    const start = Date.now();
    const timeoutMs = request?.timeoutMs ?? DEFAULT_STABLE_TIMEOUT_MS;

    while (Date.now() - start <= timeoutMs) {
        if (isRendererStable()) {
            return {
                stable: true,
                elapsedMs: Date.now() - start,
            };
        }

        await wait(POLL_INTERVAL_MS);
    }

    return {
        stable: false,
        elapsedMs: Date.now() - start,
    };
};
