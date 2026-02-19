import { vi } from "vitest";

const testDoubles = vi.hoisted(() => ({
    mockShowSaveDialog: vi.fn(),
    mockShowOpenDialog: vi.fn(),
    mockGetAllWindows: vi.fn(),
    mockSetLogLevel: vi.fn(),
    mockInitializeMainI18n: vi.fn(),
}));

export const {
    mockShowSaveDialog,
    mockShowOpenDialog,
    mockGetAllWindows,
    mockSetLogLevel,
    mockInitializeMainI18n,
} = testDoubles;

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    dialog: {
        showSaveDialog: mockShowSaveDialog,
        showOpenDialog: mockShowOpenDialog,
    },
    BrowserWindow: {
        getAllWindows: mockGetAllWindows,
    },
    screen: {
        getPrimaryDisplay: () => ({
            workAreaSize: {
                width: 1920,
                height: 1080,
            },
        }),
    },
    app: {
        isPackaged: true,
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
    setLogLevel: mockSetLogLevel,
}));

vi.mock("@/i18n/mainI18n", () => ({
    initializeMainI18n: mockInitializeMainI18n,
}));
