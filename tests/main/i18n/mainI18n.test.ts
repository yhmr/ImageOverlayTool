import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockCreateInstance,
    mockInit,
    mockChangeLanguage,
    mockT,
    mockInstance,
} = vi.hoisted(() => {
    const init = vi.fn();
    const changeLanguage = vi.fn();
    const t = vi.fn();
    const instance = {
        language: "en",
        init,
        changeLanguage,
        t,
    };
    return {
        mockCreateInstance: vi.fn(() => instance),
        mockInit: init,
        mockChangeLanguage: changeLanguage,
        mockT: t,
        mockInstance: instance,
    };
});

vi.mock("i18next", () => ({
    createInstance: mockCreateInstance,
}));

const loadModule = async () => import("@/i18n/mainI18n");

describe("mainI18n", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        mockInstance.language = "en";
        mockCreateInstance.mockReturnValue(mockInstance as any);
        mockInit.mockImplementation(async (options?: { lng?: string }) => {
            mockInstance.language = options?.lng ?? "en";
            return undefined;
        });
        mockChangeLanguage.mockImplementation(async (lng: string) => {
            mockInstance.language = lng;
            return undefined;
        });
        mockT.mockImplementation((key: string) => `translated:${key}`);
    });

    it("initializes with normalized language and i18n options", async () => {
        const { initializeMainI18n } = await loadModule();

        await initializeMainI18n(" JA ");

        expect(mockCreateInstance).toHaveBeenCalledTimes(1);
        expect(mockInit).toHaveBeenCalledWith(
            expect.objectContaining({
                lng: "ja",
                fallbackLng: "en",
                returnEmptyString: false,
                parseMissingKeyHandler: expect.any(Function),
            })
        );
    });

    it("does not call changeLanguage when resolved language is unchanged", async () => {
        const { initializeMainI18n } = await loadModule();

        await initializeMainI18n("en");
        await initializeMainI18n("en-US");

        expect(mockInit).toHaveBeenCalledTimes(1);
        expect(mockChangeLanguage).not.toHaveBeenCalled();
    });

    it("changes language on later initialization when language differs", async () => {
        const { initializeMainI18n } = await loadModule();

        await initializeMainI18n("en");
        await initializeMainI18n("ja");

        expect(mockInit).toHaveBeenCalledTimes(1);
        expect(mockChangeLanguage).toHaveBeenCalledWith("ja");
    });

    it("reuses single initPromise for concurrent initialization calls", async () => {
        let resolveInit: (() => void) | null = null;
        mockInit.mockImplementation(
            (options?: { lng?: string }) =>
                new Promise<void>((resolve) => {
                    mockInstance.language = options?.lng ?? "en";
                    resolveInit = resolve;
                })
        );

        const { initializeMainI18n } = await loadModule();
        const p1 = initializeMainI18n("en");
        const p2 = initializeMainI18n("ja");

        expect(mockInit).toHaveBeenCalledTimes(1);
        resolveInit?.();
        await Promise.all([p1, p2]);

        expect(mockChangeLanguage).toHaveBeenCalledWith("ja");
    });

    it("translates unsaved-changes keys via scoped key path", async () => {
        const { tUnsavedChanges } = await loadModule();

        const value = tUnsavedChanges("title");

        expect(mockT).toHaveBeenCalledWith("render.unsaved_changes.title");
        expect(value).toBe("translated:render.unsaved_changes.title");
    });
});
