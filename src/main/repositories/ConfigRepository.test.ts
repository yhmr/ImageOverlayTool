import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfigRepository } from "./ConfigRepository";
import Store from "electron-store";
import { AppConfig } from "../../shared/types/AppConfig";
// Mock electron
vi.mock("electron", () => ({
  screen: {
    getPrimaryDisplay: () => ({
      workAreaSize: { width: 1920, height: 1080 },
    }),
  },
}));

// Mock electron-store
const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
};

// Mock calcCenterPosition to avoid dependency on real calculation logic if needed,
// but since it's a util, maybe we can use real one or mock it.
// Let's use real one but we need to know what it returns.
// Actually, let's mock the store behavior to return defaults when key is missing.

describe("ConfigRepository", () => {
  let repository: ConfigRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ConfigRepository(mockStore as unknown as Store<AppConfig>);
  });

  it("should load settings", async () => {
    mockStore.get.mockReturnValue("ja");
    const settings = await repository.loadSettings();
    expect(mockStore.get).toHaveBeenCalledWith("setting.language", "en");
    expect(settings.language).toBe("ja");
  });

  it("should save settings", async () => {
    await repository.saveSettings({ language: "ja" });
    expect(mockStore.set).toHaveBeenCalledWith("setting.language", "ja");
  });

  it("should load window color", async () => {
    mockStore.get.mockReturnValue("#123456");
    const color = await repository.loadWindowColor();
    expect(mockStore.get).toHaveBeenCalledWith("window.color", "#FFFFFF55");
    expect(color).toBe("#123456");
  });

  it("should save window color", async () => {
    await repository.saveWindowColor("#654321");
    expect(mockStore.set).toHaveBeenCalledWith("window.color", "#654321");
  });

  it("should get window position and size", () => {
    // Mock get for position and size
    mockStore.get.mockImplementation((key: string, defaultValue: any) => {
      if (key === "window.pos") return [100, 100];
      if (key === "window.size") return [800, 600];
      return defaultValue;
    });

    const { pos, size } = repository.getWindowPositionAndSize();

    expect(mockStore.get).toHaveBeenCalledWith("window.pos");
    expect(mockStore.get).toHaveBeenCalledWith("window.size");

    expect(pos).toEqual({ x: 100, y: 100 });
    expect(size).toEqual({ width: 800, height: 600 });
  });

  it("should use default window position if store is empty", () => {
    // Mock get to return default value
    mockStore.get.mockImplementation(
      (key: string, defaultValue: any) => defaultValue
    );

    const { pos, size } = repository.getWindowPositionAndSize();

    // 1920x1080 screen, 800x600 default size
    // x = (1920 - 800) / 2 = 560
    // y = (1080 - 600) / 2 = 240
    // But let's check if it calls calcCenterPosition indirectly or just returns whatever default logic does
    // The repository calculates default and passes it to store.get('window.pos', default)
    // Since we return defaultValue from mock, we get the calculated value.

    expect(pos).toEqual({ x: 560, y: 240 });
    expect(size).toEqual({ width: 800, height: 600 });
  });

  it("should save window position and size", () => {
    repository.saveWindowPositionAndSize([200, 200], [1024, 768]);

    expect(mockStore.set).toHaveBeenCalledWith("window.pos", [200, 200]);
    expect(mockStore.set).toHaveBeenCalledWith("window.size", [1024, 768]);
  });
});
