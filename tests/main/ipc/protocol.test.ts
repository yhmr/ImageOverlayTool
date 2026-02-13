import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";

const { registerSchemesAsPrivilegedMock, handleMock, fetchMock } = vi.hoisted(
    () => ({
        registerSchemesAsPrivilegedMock: vi.fn(),
        handleMock: vi.fn(),
        fetchMock: vi.fn(),
    })
);

vi.mock("electron", () => ({
    app: {
        isPackaged: false,
    },
    protocol: {
        registerSchemesAsPrivileged: registerSchemesAsPrivilegedMock,
        handle: handleMock,
    },
    net: {
        fetch: fetchMock,
    },
}));

vi.mock("fs/promises");

import {
    registerLocalResourceProtocol,
    setupProtocolHandler,
} from "@/main/ipc/protocol";

describe("protocol handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));
        vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true } as never);
    });

    it("registerLocalResourceProtocol should disable bypassCSP", () => {
        registerLocalResourceProtocol();

        expect(registerSchemesAsPrivilegedMock).toHaveBeenCalledWith([
            {
                scheme: "local-file",
                privileges: {
                    standard: true,
                    secure: true,
                    supportFetchAPI: false,
                    bypassCSP: false,
                },
            },
        ]);
    });

    it("setupProtocolHandler should fetch local image files", async () => {
        setupProtocolHandler();
        const handler = handleMock.mock.calls[0][1] as (
            request: unknown
        ) => Promise<Response>;

        const requestUrl =
            process.platform === "win32"
                ? "local-file://C:/tmp/a.png"
                : "local-file:///tmp/a.png";

        await handler({
            method: "GET",
            url: requestUrl,
        });

        expect(fs.stat).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(String(fetchMock.mock.calls[0][0]).startsWith("file://")).toBe(
            true
        );
    });

    it("setupProtocolHandler should reject non-image files", async () => {
        setupProtocolHandler();
        const handler = handleMock.mock.calls[0][1] as (
            request: unknown
        ) => Promise<Response>;

        const requestUrl =
            process.platform === "win32"
                ? "local-file://C:/tmp/a.txt"
                : "local-file:///tmp/a.txt";

        const response = await handler({
            method: "GET",
            url: requestUrl,
        });

        expect(response.status).toBe(403);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("setupProtocolHandler should reject non-GET methods", async () => {
        setupProtocolHandler();
        const handler = handleMock.mock.calls[0][1] as (
            request: unknown
        ) => Promise<Response>;

        const response = await handler({
            method: "POST",
            url: "local-file:///tmp/a.png",
        });

        expect(response.status).toBe(405);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("setupProtocolHandler should reject non-absolute paths", async () => {
        setupProtocolHandler();
        const handler = handleMock.mock.calls[0][1] as (
            request: unknown
        ) => Promise<Response>;

        const response = await handler({
            method: "GET",
            url: "local-file://dummy.png",
        });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
