import { describe, expect, it } from "vitest";
import {
    DEFAULT_LANGUAGE,
    I18N_RESOURCES,
    SUPPORTED_LANGUAGES,
    normalizeLanguage,
} from "@/i18n/languages";

describe("i18n/languages", () => {
    it("normalizes exact supported languages", () => {
        expect(normalizeLanguage("en")).toBe("en");
        expect(normalizeLanguage("ja")).toBe("ja");
    });

    it("normalizes case and trims whitespace", () => {
        expect(normalizeLanguage(" JA ")).toBe("ja");
        expect(normalizeLanguage(" En ")).toBe("en");
    });

    it("normalizes locale variants to base language", () => {
        expect(normalizeLanguage("en-US")).toBe("en");
        expect(normalizeLanguage("ja-JP")).toBe("ja");
    });

    it("falls back to default for unknown/empty values", () => {
        expect(normalizeLanguage("fr")).toBe(DEFAULT_LANGUAGE);
        expect(normalizeLanguage("")).toBe(DEFAULT_LANGUAGE);
        expect(normalizeLanguage(null)).toBe(DEFAULT_LANGUAGE);
        expect(normalizeLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
    });

    it("exports supported language/resources shape", () => {
        expect(SUPPORTED_LANGUAGES).toEqual(["en", "ja"]);
        expect(I18N_RESOURCES.en.translation).toBeTypeOf("object");
        expect(I18N_RESOURCES.ja.translation).toBeTypeOf("object");
    });
});
