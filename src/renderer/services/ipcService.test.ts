/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
    getIPCService,
    setIPCService,
    resetIPCService,
    MockIPCService,
    IIPCService,
} from "./ipcService";

describe("ipcService", () => {
    beforeEach(() => {
        resetIPCService();
    });

    describe("MockIPCService", () => {
        it("should record updateImageSets calls", async () => {
            const mock = new MockIPCService();
            const imageSets = [
                {
                    id: "test-1",
                    path: "/test.png",
                    transparency: 0,
                    rotation: 0,
                    init_anchor_pos: null,
                    current_anchor_pos: null,
                },
            ];

            await mock.updateImageSets(imageSets);

            expect(mock.updateImageSetsCalls).toHaveLength(1);
            expect(mock.updateImageSetsCalls[0]).toEqual(imageSets);
        });

        it("should record updateUnitFactor calls", async () => {
            const mock = new MockIPCService();

            await mock.updateUnitFactor(2.5);
            await mock.updateUnitFactor(1.0);

            expect(mock.updateUnitFactorCalls).toHaveLength(2);
            expect(mock.updateUnitFactorCalls[0]).toBe(2.5);
            expect(mock.updateUnitFactorCalls[1]).toBe(1.0);
        });

        it("should reset recorded calls", async () => {
            const mock = new MockIPCService();

            await mock.updateUnitFactor(1.5);
            expect(mock.updateUnitFactorCalls).toHaveLength(1);

            mock.reset();

            expect(mock.updateImageSetsCalls).toHaveLength(0);
            expect(mock.updateUnitFactorCalls).toHaveLength(0);
        });
    });

    describe("setIPCService / getIPCService", () => {
        it("should allow setting a custom service", () => {
            const mock = new MockIPCService();

            setIPCService(mock);

            expect(getIPCService()).toBe(mock);
        });

        it("should switch to mock service", async () => {
            const mock = new MockIPCService();
            setIPCService(mock);

            const service = getIPCService();
            await service.updateUnitFactor(3.0);

            expect(mock.updateUnitFactorCalls).toContain(3.0);
        });
    });
});
