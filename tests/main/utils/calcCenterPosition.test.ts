import { expect, test, describe } from "vitest";
import { calcCenterPosition } from "@/main/utils/calcCenterPosition";

describe("calcCenterPosition", () => {
    test("centers window correctly", () => {
        const workArea = { width: 1920, height: 1080 };
        const windowSize = { width: 800, height: 600 };
        const [x, y] = calcCenterPosition(workArea, windowSize);

        // (1920 - 800) / 2 = 1120 / 2 = 560
        // (1080 - 600) / 2 = 480 / 2 = 240
        expect(x).toBe(560);
        expect(y).toBe(240);
    });

    test("handles flooring correctly", () => {
        const workArea = { width: 100, height: 100 };
        const windowSize = { width: 33, height: 33 };
        const [x, y] = calcCenterPosition(workArea, windowSize);
        // (100 - 33) / 2 = 67 / 2 = 33.5 -> 33
        expect(x).toBe(33);
        expect(y).toBe(33);
    });
});
