import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { languages, translations } from './translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'ft-lang';
const DEFAULT_LANG = 'tr';
const SUPPORTED_LANGS = new Set(languages.map((language) => language.code));

function resolveInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
  } catch {
    /* ignore */
  }

  try {
    const browserLanguages = navigator.languages ?? [navigator.language];
    for (const candidate of browserLanguages) {
      const normalized = candidate?.toLowerCase().split('-')[0];
      if (normalized && SUPPORTED_LANGS.has(normalized)) {
        return normalized;
      }
    }
  } catch {
    /* ignore */
  }

  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(resolveInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: translations[lang] ?? translations[DEFAULT_LANG],
      languages,
    }),
    [lang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
