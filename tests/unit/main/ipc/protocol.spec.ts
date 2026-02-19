import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";

const {
    registerSchemesAsPrivilegedMock,
    handleMock,
    fetchMock,
    logErrorMock,
} = vi.hoisted(() => ({
        registerSchemesAsPrivilegedMock: vi.fn(),
        handleMock: vi.fn(),
        fetchMock: vi.fn(),
        logErrorMock: vi.fn(),
    }));

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
vi.mock("@/main/logger", () => ({
    default: {
        error: logErrorMock,
    },
}));

vi.mock("fs/promises");

import {
    registerLocalResourceProtocol,
    setupProtocolHandler,
} from "@/main/ipc/protocol";

describe("protocol handlers", () => {
    const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(
        process,
        "platform"
    );
    const setProcessPlatform = (platform: NodeJS.Platform) => {
        Object.defineProperty(process, "platform", { value: platform });
    };

    type LocalProtocolRequest = {
        method: string;
        url: string;
    };
    type LocalProtocolHandler = (request: LocalProtocolRequest) => Promise<Response>;

    const getHandler = (): LocalProtocolHandler => {
        setupProtocolHandler();
        const [, handler] = vi.mocked(handleMock).mock.lastCall ?? [];
        if (typeof handler !== "function") {
            throw new Error("protocol handler should be registered");
        }
        return handler as LocalProtocolHandler;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));
        vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true } as never);
    });
    afterEach(() => {
        if (originalPlatformDescriptor) {
            Object.defineProperty(
                process,
                "platform",
                originalPlatformDescriptor
            );
        }
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
        const handler = getHandler();

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
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/^file:\/\//)
        );
    });

    it("setupProtocolHandler should reject non-image files", async () => {
        const handler = getHandler();

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
        const handler = getHandler();

        const response = await handler({
            method: "POST",
            url: "local-file:///tmp/a.png",
        });

        expect(response.status).toBe(405);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("setupProtocolHandler should reject non-absolute paths", async () => {
        const handler = getHandler();

        const response = await handler({
            method: "GET",
            url: "local-file://dummy.png",
        });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("setupProtocolHandler should reject invalid url strings", async () => {
        const handler = getHandler();

        const response = await handler({
            method: "GET",
            url: "::not a url::",
        });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("setupProtocolHandler should reject non local-file protocol", async () => {
        const handler = getHandler();

        const response = await handler({
            method: "GET",
            url: "https://example.com/a.png",
        });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("setupProtocolHandler should accept Windows absolute path with leading slash", async () => {
        const handler = getHandler();
        const requestUrl =
            process.platform === "win32"
                ? "local-file:///C:/tmp/a.PNG"
                : "local-file:///tmp/a.PNG";

        const response = await handler({
            method: "GET",
            url: requestUrl,
        });

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("setupProtocolHandler should return 404 when local path is not a file", async () => {
        vi.mocked(fs.stat).mockResolvedValue({ isFile: () => false } as never);
        const handler = getHandler();
        const requestUrl =
            process.platform === "win32"
                ? "local-file://C:/tmp/a.png"
                : "local-file:///tmp/a.png";

        const response = await handler({
            method: "GET",
            url: requestUrl,
        });

        expect(response.status).toBe(404);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("setupProtocolHandler should return 404 and log when fs.stat throws", async () => {
        vi.mocked(fs.stat).mockRejectedValue(new Error("stat failed"));
        const handler = getHandler();
        const requestUrl =
            process.platform === "win32"
                ? "local-file://C:/tmp/a.png"
                : "local-file:///tmp/a.png";

        const response = await handler({
            method: "GET",
            url: requestUrl,
        });

        expect(response.status).toBe(404);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(logErrorMock).toHaveBeenCalledWith(
            "Protocol error:",
            expect.any(Error)
        );
    });

    it("setupProtocolHandler should reject POSIX local-file URLs with host names", async () => {
        setProcessPlatform("linux");
        const handler = getHandler();

        const response = await handler({
            method: "GET",
            url: "local-file://host/tmp/a.png",
        });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("setupProtocolHandler should accept POSIX absolute local-file paths", async () => {
        setProcessPlatform("linux");
        const handler = getHandler();

        const response = await handler({
            method: "GET",
            url: "local-file:///tmp/a.png",
        });

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
