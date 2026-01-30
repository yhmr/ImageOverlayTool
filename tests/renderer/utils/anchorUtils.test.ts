import { describe, it, expect } from "vitest";
import { rotateAnchorPos, getCenter, rotatePoint } from "@/renderer/utils/anchorUtils";
import { AnchorPos } from "@/shared/types/AnchorPos";

describe("anchorUtils", () => {
    describe("getCenter", () => {
        it("should calculate the center of a square correctly", () => {
            const anchors: AnchorPos = {
                lt: { x: 0, y: 0 },
                lb: { x: 0, y: 100 },
                rt: { x: 100, y: 0 },
                rb: { x: 100, y: 100 },
            };
            const center = getCenter(anchors);
            expect(center).toEqual({ x: 50, y: 50 });
        });
    });

    describe("rotatePoint", () => {
        it("should rotate a point 90 degrees around center", () => {
            const point = { x: 100, y: 0 };
            const center = { x: 0, y: 0 };
            const rotated = rotatePoint(point, center, 90);
            expect(rotated.x).toBeCloseTo(0);
            expect(rotated.y).toBeCloseTo(100);
        });

        it("should rotate a point 180 degrees around center", () => {
            const point = { x: 100, y: 0 };
            const center = { x: 0, y: 0 };
            const rotated = rotatePoint(point, center, 180);
            expect(rotated.x).toBeCloseTo(-100);
            expect(rotated.y).toBeCloseTo(0);
        });
    });

    describe("rotateAnchorPos", () => {
        it("should rotate all anchors 90 degrees", () => {
            const anchors: AnchorPos = {
                lt: { x: -10, y: -10 },
                rt: { x: 10, y: -10 },
                rb: { x: 10, y: 10 },
                lb: { x: -10, y: 10 },
            };
            // Center is 0,0

            // lt(-10, -10) -> 90 deg -> (10, -10) which is old rt position?
            // x' = x cos - y sin, y' = x sin + y cos
            // -10 * 0 - (-10) * 1 = 10
            // -10 * 1 + (-10) * 0 = -10
            // So lt becomes (10, -10)

            const rotated = rotateAnchorPos(anchors, 90);

            expect(rotated.lt.x).toBeCloseTo(10);
            expect(rotated.lt.y).toBeCloseTo(-10);

            expect(rotated.rt.x).toBeCloseTo(10);
            expect(rotated.rt.y).toBeCloseTo(10);

            expect(rotated.rb.x).toBeCloseTo(-10);
            expect(rotated.rb.y).toBeCloseTo(10);

            expect(rotated.lb.x).toBeCloseTo(-10);
            expect(rotated.lb.y).toBeCloseTo(-10);
        });
    });
});

