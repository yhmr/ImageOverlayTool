import translationEn from "./en.json";
import translationJa from "./ja.json";

export type AppTranslation = typeof translationEn;

export const SUPPORTED_LANGUAGES = ["en", "ja"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);

export const normalizeLanguage = (
    language?: string | null
): SupportedLanguage => {
    const normalized = (language ?? "").trim().toLowerCase();
    if (SUPPORTED_LANGUAGE_SET.has(normalized)) {
        return normalized as SupportedLanguage;
    }

    const baseLanguage = normalized.split("-")[0];
    if (SUPPORTED_LANGUAGE_SET.has(baseLanguage)) {
        return baseLanguage as SupportedLanguage;
    }

    return DEFAULT_LANGUAGE;
};

export const I18N_RESOURCES = {
    en: {
        translation: translationEn,
    },
    ja: {
        translation: translationJa,
    },
} satisfies Record<SupportedLanguage, { translation: AppTranslation }>;
