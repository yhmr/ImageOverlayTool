import type { ProjectSyncSnapshot, SyncBroadcaster } from "./syncBroadcaster";

interface CreateProjectSyncBridgeParams {
    initialSnapshot: ProjectSyncSnapshot;
    broadcaster: SyncBroadcaster;
}

export interface ProjectSyncBridge {
    sync: (nextSnapshot: ProjectSyncSnapshot) => void;
}

export const createProjectSyncBridge = ({
    initialSnapshot,
    broadcaster,
}: CreateProjectSyncBridgeParams): ProjectSyncBridge => {
    let previousSnapshot = initialSnapshot;

    return {
        sync: (nextSnapshot) => {
            broadcaster.broadcastDiff(previousSnapshot, nextSnapshot);
            previousSnapshot = nextSnapshot;
        },
    };
};
