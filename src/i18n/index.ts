import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export const SUPPORTED_LOCALES = ["pt-BR", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const STORAGE_KEY = "app.locale";

/**
 * Carregamento lazy: usa import() dinâmico para que cada bundle de tradução
 * só seja baixado quando o idioma é ativado.
 */
async function loadLocale(lng: string) {
  if (i18n.hasResourceBundle(lng, "translation")) return;
  try {
    const mod = await import(`./locales/${lng}.json`);
    i18n.addResourceBundle(lng, "translation", mod.default || mod, true, true);
  } catch (err) {
    console.warn(`[i18n] Falha ao carregar locale '${lng}':`, err);
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: "currentOnly",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    resources: {}, // populado sob demanda via loadLocale
  });

// Garante locale default pt-BR se nada for detectado
if (!i18n.language) {
  i18n.changeLanguage("pt-BR");
}

// Carrega o idioma inicial e o fallback
loadLocale(i18n.language || "pt-BR");
loadLocale("en");

// Quando o idioma muda, carrega o bundle correspondente
i18n.on("languageChanged", (lng) => {
  loadLocale(lng);
});

export function changeLocale(locale: SupportedLocale) {
  return i18n.changeLanguage(locale);
}

export function getCurrentLocale(): SupportedLocale {
  const lng = (i18n.language || "pt-BR") as string;
  if (lng.startsWith("pt")) return "pt-BR";
  if (lng.startsWith("en")) return "en";
  return "pt-BR";
}

export default i18n;
