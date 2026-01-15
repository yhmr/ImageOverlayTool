import { expect, test, describe, vi, beforeEach } from "vitest";
import { ProjectRepository } from "./ProjectRepository";
import { ProjectFile } from "../../shared/types/ProjectFile";
import fs from "fs/promises";

// Mock fs/promises
vi.mock("fs/promises");

describe("ProjectRepository", () => {
  let repository: ProjectRepository;
  const mockProjectFile: ProjectFile = {
    version: "1.0.0",
    window: {
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      color: "#000000",
    },
    settings: {
      unit_factor: 1,
    },
    images: [],
  };

  beforeEach(() => {
    repository = new ProjectRepository();
    vi.clearAllMocks();
  });

  test("saveProject should write json to file", async () => {
    const filePath = "/test/path/project.json";
    await repository.saveProject(filePath, mockProjectFile);

    expect(fs.writeFile).toHaveBeenCalledWith(
      filePath,
      JSON.stringify(mockProjectFile, null, 2),
      "utf-8"
    );
  });

  test("loadProject should read file and parse json", async () => {
    const filePath = "/test/path/project.json";

    // Setup mock return value
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockProjectFile));

    const result = await repository.loadProject(filePath);

    expect(fs.readFile).toHaveBeenCalledWith(filePath, "utf-8");
    expect(result).toEqual(mockProjectFile);
  });
});
