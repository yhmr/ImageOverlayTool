export interface ProjectFile<TImage = unknown> {
    version: string;
    window: {
        width: number;
        height: number;
        x: number;
        y: number;
        color: string; // Includes alpha for background transparency
    };
    settings: {
        unitFactor: number;
        unit: "nm" | "um" | "mm";
    };
    canvas?: {
        x: number;
        y: number;
        scale: number;
    };
    images: TImage[];
    dimensionLines?: {
        id: string;
        start: { x: number; y: number };
        end: { x: number; y: number };
    }[];
}
