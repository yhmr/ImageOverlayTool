export type InteractionMode = "default" | "dimension_add" | "dimension_select";

export const isDimensionInteractionMode = (mode: InteractionMode): boolean =>
    mode !== "default";
