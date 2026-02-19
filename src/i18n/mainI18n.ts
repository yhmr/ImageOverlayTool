import { createInstance, type i18n as I18nInstance } from "i18next";
import {
    DEFAULT_LANGUAGE,
    I18N_RESOURCES,
    normalizeLanguage,
    type AppTranslation,
} from "./languages";

type UnsavedChangesTranslationKey =
    keyof AppTranslation["render"]["unsaved_changes"];

type ErrorDialogTranslationKey = keyof AppTranslation["main"]["error_dialog"];

const mainI18n: I18nInstance = createInstance();
let initPromise: Promise<void> | null = null;

export const initializeMainI18n = async (language?: string): Promise<void> => {
    const resolvedLanguage = normalizeLanguage(language);

    if (!initPromise) {
        initPromise = mainI18n
            .init({
                resources: I18N_RESOURCES,
                lng: resolvedLanguage,
                fallbackLng: DEFAULT_LANGUAGE,
                returnEmptyString: false,
                parseMissingKeyHandler: (key) => `[missing] ${key}`,
                interpolation: {
                    escapeValue: false,
                },
            })
            .then(() => undefined);
        await initPromise;
        return;
    }

    await initPromise;
    if (mainI18n.language !== resolvedLanguage) {
        await mainI18n.changeLanguage(resolvedLanguage);
    }
};

export const tUnsavedChanges = (key: UnsavedChangesTranslationKey): string => {
    return mainI18n.t(`render.unsaved_changes.${key}`);
};

export const tErrorDialog = (
    key: ErrorDialogTranslationKey,
    variables?: Record<string, string>
): string => {
    return mainI18n.t(`main.error_dialog.${key}`, variables);
};
