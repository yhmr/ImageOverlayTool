/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import en from "@/i18n/en.json";
import ja from "@/i18n/ja.json";

const SOURCE_ROOT = path.resolve("src");
const TRANSLATION_CALL_PATTERN = /\bt\(\s*["']([^"'`]+)["']/g;
const DEFAULT_VALUE_PATTERN = /\bt\(\s*["'][^"'`]+["']\s*,\s*["'`]/;

const collectSourceFiles = (directory: string): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectSourceFiles(fullPath));
            continue;
        }
        if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }

    return files;
};

const hasTranslationKey = (dictionary: unknown, keyPath: string): boolean => {
    const keys = keyPath.split(".");
    let current: unknown = dictionary;

    for (const key of keys) {
        if (
            !current ||
            typeof current !== "object" ||
            !(key in (current as Record<string, unknown>))
        ) {
            return false;
        }
        current = (current as Record<string, unknown>)[key];
    }

    return true;
};

describe("translation consistency", () => {
    it("does not use t(key, fallback) style defaults in source code", () => {
        const files = collectSourceFiles(SOURCE_ROOT);
        const violations: string[] = [];

        for (const filePath of files) {
            const source = fs.readFileSync(filePath, "utf8");
            if (DEFAULT_VALUE_PATTERN.test(source)) {
                violations.push(path.relative(process.cwd(), filePath));
            }
        }

        expect(violations).toEqual([]);
    });

    it("all translation keys used in source exist in both ja/en", () => {
        const files = collectSourceFiles(SOURCE_ROOT);
        const keys = new Set<string>();

        for (const filePath of files) {
            const source = fs.readFileSync(filePath, "utf8");
            let match: RegExpExecArray | null = null;
            while ((match = TRANSLATION_CALL_PATTERN.exec(source)) !== null) {
                keys.add(match[1]);
            }
        }

        const missingInJa = [...keys].filter((key) => !hasTranslationKey(ja, key));
        const missingInEn = [...keys].filter((key) => !hasTranslationKey(en, key));

        expect(missingInJa).toEqual([]);
        expect(missingInEn).toEqual([]);
    });
});
