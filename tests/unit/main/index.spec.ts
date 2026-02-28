/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockAppQuit,
    mockMenuSetApplicationMenu,
    mockRegisterEarlyIpcHandlers,
    mockRegisterProcessErrorHandlers,
    mockRegisterLocalResourceProtocol,
    mockAcquireSingleInstanceLock,
    mockResolveCliHelpRequest,
    mockResolveCliSceneTemplateRequest,
    mockResolveCliValidateSceneRequest,
    mockResolveSecondInstanceCommand,
    mockRegisterSingleInstanceHandlers,
    mockSettingsRepositoryCreate,
    mockWindowRepositoryCreate,
    mockProjectRepositoryCreate,
    mockWindowManagerCtor,
} = vi.hoisted(() => ({
    mockAppQuit: vi.fn(),
    mockMenuSetApplicationMenu: vi.fn(),
    mockRegisterEarlyIpcHandlers: vi.fn(),
    mockRegisterProcessErrorHandlers: vi.fn(),
    mockRegisterLocalResourceProtocol: vi.fn(),
    mockAcquireSingleInstanceLock: vi.fn(() => false),
    mockResolveCliHelpRequest: vi.fn(() => null),
    mockResolveCliSceneTemplateRequest: vi.fn(() => null),
    mockResolveCliValidateSceneRequest: vi.fn(() => null),
    mockResolveSecondInstanceCommand: vi.fn(() => null),
    mockRegisterSingleInstanceHandlers: vi.fn(),
    mockSettingsRepositoryCreate: vi.fn(() => ({})),
    mockWindowRepositoryCreate: vi.fn(() => ({})),
    mockProjectRepositoryCreate: vi.fn(() => ({})),
    mockWindowManagerCtor: vi.fn(() => ({
        launchMainWindow: vi.fn(),
        applyLaunchIntent: vi.fn(),
        openFile: vi.fn(),
        registerShortcuts: vi.fn(),
        openDevTools: vi.fn(),
    })),
}));

vi.mock("electron", () => ({
    app: {
        isPackaged: false,
        quit: mockAppQuit,
        whenReady: vi.fn(),
        on: vi.fn(),
    },
    BrowserWindow: vi.fn(),
    Menu: {
        setApplicationMenu: mockMenuSetApplicationMenu,
    },
}));

vi.mock("electron-devtools-installer", () => ({
    installExtension: vi.fn(),
    REDUX_DEVTOOLS: "REDUX_DEVTOOLS",
    REACT_DEVELOPER_TOOLS: "REACT_DEVELOPER_TOOLS",
}));

vi.mock("@electron-toolkit/utils", () => ({
    is: {
        dev: false,
    },
}));

vi.mock("@/main/bootstrap/ipcRegistration", () => ({
    registerCoreIpcHandlers: vi.fn(),
    registerEarlyIpcHandlers: mockRegisterEarlyIpcHandlers,
    registerWindowIpcHandlers: vi.fn(),
}));

vi.mock("@/main/bootstrap/lifecycle", () => ({
    registerProcessErrorHandlers: mockRegisterProcessErrorHandlers,
    registerShutdownHandlers: vi.fn(),
}));

vi.mock("@/main/bootstrap/cliHelp", () => ({
    buildCliHelpPayload: vi.fn(),
    renderCliHelp: vi.fn(),
    resolveCliHelpRequest: mockResolveCliHelpRequest,
}));

vi.mock("@/main/bootstrap/cliSceneTemplate", () => ({
    buildSceneTemplate: vi.fn(),
    renderSceneTemplate: vi.fn(),
    resolveCliSceneTemplateRequest: mockResolveCliSceneTemplateRequest,
}));

vi.mock("@/main/bootstrap/cliValidateScene", () => ({
    renderSceneValidationText: vi.fn(),
    resolveCliValidateSceneRequest: mockResolveCliValidateSceneRequest,
    validateSceneFromPath: vi.fn(),
}));

vi.mock("@/main/bootstrap/cliResult", () => ({
    CLI_EXIT_CODES: {
        SUCCESS: 0,
        INVALID_ARGUMENT: 2,
        VALIDATION_FAILED: 3,
    },
    createCliSuccessResult: vi.fn(),
    stringifyCliJsonResult: vi.fn(),
}));

vi.mock("@/main/bootstrap/cliErrorHandler", () => ({
    reportStartupLaunchParseError: vi.fn(),
    writeCliInvalidArgumentError: vi.fn(),
    writeCliSceneValidationError: vi.fn(),
}));

vi.mock("@/main/bootstrap/singleInstance", () => ({
    acquireSingleInstanceLock: mockAcquireSingleInstanceLock,
    registerSingleInstanceHandlers: mockRegisterSingleInstanceHandlers,
}));

vi.mock("@/main/bootstrap/cliRouter", () => ({
    resolveStartupCliRoute: vi.fn(),
}));

vi.mock("@/main/bootstrap/secondInstanceCommand", () => ({
    resolveSecondInstanceCommand: mockResolveSecondInstanceCommand,
}));

vi.mock("@/main/ipc/protocol", () => ({
    registerLocalResourceProtocol: mockRegisterLocalResourceProtocol,
    setupProtocolHandler: vi.fn(),
}));

vi.mock("@/i18n/mainI18n", () => ({
    initializeMainI18n: vi.fn(),
}));

vi.mock("@/main/logger", () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
    },
    setLogLevel: vi.fn(),
}));

vi.mock("@/main/repositories/ProjectRepositoryFactory", () => ({
    ProjectRepositoryFactory: {
        create: mockProjectRepositoryCreate,
    },
}));

vi.mock("@/main/repositories/SettingsRepositoryFactory", () => ({
    SettingsRepositoryFactory: {
        create: mockSettingsRepositoryCreate,
    },
}));

vi.mock("@/main/repositories/WindowRepositoryFactory", () => ({
    WindowRepositoryFactory: {
        create: mockWindowRepositoryCreate,
    },
}));

vi.mock("@/main/windows/windowManager", () => ({
    WindowManager: function WindowManager() {
        return mockWindowManagerCtor();
    },
}));

vi.mock("@/main/services/clipboardCacheService", () => ({
    cleanupClipboardCache: vi.fn(),
}));

describe("main/index startup wiring", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("registers early startup hooks and quits when single-instance lock is unavailable", async () => {
        await import("@/main/index");

        expect(mockMenuSetApplicationMenu).toHaveBeenCalledWith(null);
        expect(mockRegisterEarlyIpcHandlers).toHaveBeenCalledTimes(1);
        expect(mockRegisterProcessErrorHandlers).toHaveBeenCalledTimes(1);
        expect(mockRegisterLocalResourceProtocol).toHaveBeenCalledTimes(1);
        expect(mockAcquireSingleInstanceLock).toHaveBeenCalledWith();
        expect(mockAppQuit).toHaveBeenCalledTimes(1);
        expect(mockRegisterSingleInstanceHandlers).not.toHaveBeenCalled();
    });
});
