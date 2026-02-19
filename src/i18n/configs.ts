import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, I18N_RESOURCES } from "./languages";

i18n.use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources: I18N_RESOURCES,
        lng: DEFAULT_LANGUAGE,
        returnEmptyString: false,
        parseMissingKeyHandler: (key) => `[missing] ${key}`,
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

export default i18n;
