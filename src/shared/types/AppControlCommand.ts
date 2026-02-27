export type AppControlCommand =
    | {
          kind: "add-image";
          imagePath: string;
          opacity?: number;
      }
    | {
          kind: "set-opacity";
          opacity: number;
      };
