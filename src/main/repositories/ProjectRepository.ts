import fs from "fs/promises";
import { ProjectFile } from "../../shared/types/ProjectFile";
import { ImageSet } from "../../shared/types/ImageSet";

export interface IProjectRepository {
    saveProject(filePath: string, project: ProjectFile): Promise<void>;
    loadProject(filePath: string): Promise<ProjectFile>;
}

type SerializedImageSet = Omit<
    ImageSet,
    "initAnchorPos" | "currentAnchorPos"
> & {
    initAnchorPos?: ImageSet["initAnchorPos"];
    currentAnchorPos?: ImageSet["currentAnchorPos"];
    init_anchor_pos?: ImageSet["initAnchorPos"];
    current_anchor_pos?: ImageSet["currentAnchorPos"];
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const toSerializedImage = (value: unknown): unknown => {
    if (!isObjectRecord(value)) {
        return value;
    }

    if (!("initAnchorPos" in value) && !("currentAnchorPos" in value)) {
        return value;
    }

    const image = value as SerializedImageSet;
    const { initAnchorPos, currentAnchorPos, ...rest } = image;
    return {
        ...rest,
        init_anchor_pos: initAnchorPos ?? null,
        current_anchor_pos: currentAnchorPos ?? null,
    };
};

const toDomainImage = (value: unknown): unknown => {
    if (!isObjectRecord(value)) {
        return value;
    }

    const hasLegacyKeys =
        "init_anchor_pos" in value || "current_anchor_pos" in value;
    const hasCurrentKeys =
        "initAnchorPos" in value || "currentAnchorPos" in value;

    if (!hasLegacyKeys && !hasCurrentKeys) {
        return value;
    }

    const image = value as SerializedImageSet;
    const { init_anchor_pos, current_anchor_pos, ...rest } = image;
    return {
        ...rest,
        initAnchorPos: image.initAnchorPos ?? init_anchor_pos ?? null,
        currentAnchorPos: image.currentAnchorPos ?? current_anchor_pos ?? null,
    };
};

export class ProjectRepository implements IProjectRepository {
    async saveProject(filePath: string, project: ProjectFile): Promise<void> {
        const serializedProject: ProjectFile = {
            ...project,
            images: Array.isArray(project.images)
                ? project.images.map((image) => toSerializedImage(image))
                : project.images,
        };

        const data = JSON.stringify(serializedProject, null, 2);
        await fs.writeFile(filePath, data, "utf-8");
    }

    async loadProject(filePath: string): Promise<ProjectFile> {
        const data = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(data) as ProjectFile;

        return {
            ...parsed,
            images: Array.isArray(parsed.images)
                ? parsed.images.map((image) => toDomainImage(image))
                : parsed.images,
        };
    }
}
