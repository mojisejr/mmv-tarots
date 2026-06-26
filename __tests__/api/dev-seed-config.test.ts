import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LOCAL_SEED_CONFIG,
  DEV_READING_CARD_IMAGE_PATH,
  loadSeedConfig,
} from "../../lib/server/dev-seed-config";

describe("local seed config loader", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("falls back to committed safe defaults when private config is missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mmv-seed-config-"));
    tempDirs.push(dir);

    const result = loadSeedConfig(path.join(dir, "missing.json"));

    expect(result.source).toBe("default");
    expect(result.config).toBe(DEFAULT_LOCAL_SEED_CONFIG);
    expect(result.config.packages.length).toBeGreaterThan(0);
    expect(result.config.suggestedQuestions.length).toBeGreaterThan(0);
  });

  it("uses the private config file when it exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mmv-seed-config-"));
    tempDirs.push(dir);
    const configPath = path.join(dir, "master-seed-config.json");
    const fileConfig = {
      packages: [
        {
          name: "Private Local",
          description: "from file",
          stars: 10,
          prices: [{ amount: 1, isPromo: false, promoLabel: null }],
        },
      ],
      suggestedQuestions: [{ text: "from file", category: "test" }],
    };
    fs.writeFileSync(configPath, JSON.stringify(fileConfig), "utf-8");

    const result = loadSeedConfig(configPath);

    expect(result.source).toBe("file");
    expect(result.config).toEqual(fileConfig);
  });

  it("uses an existing public asset for the dev reading fixture image", () => {
    expect(DEV_READING_CARD_IMAGE_PATH).toMatch(/^\//);
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          "public",
          DEV_READING_CARD_IMAGE_PATH.slice(1),
        ),
      ),
    ).toBe(true);
  });
});
