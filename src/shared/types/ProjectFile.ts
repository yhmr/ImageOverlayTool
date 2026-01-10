export interface ProjectFile<TImage = any> {
    version: string;
    window: {
        width: number;
        height: number;
        x: number;
        y: number;
        color: string; // Includes alpha for background transparency
    };
    settings: {
        unit_factor: number;
    };
    canvas?: {
        x: number;
        y: number;
        scale: number;
    };
    images: TImage[];
}
