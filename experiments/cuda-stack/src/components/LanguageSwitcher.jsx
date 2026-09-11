import './LanguageSwitcher.css';
import { useLang } from '../i18n/LanguageProvider';

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useLang();

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {languages.map((language, index) => (
        <span key={language.code} className="lang-switch__item">
          {index > 0 && <span className="lang-switch__divider" aria-hidden="true">|</span>}
          <button
            type="button"
            className={`lang-switch__btn${lang === language.code ? ' is-active' : ''}`}
            aria-pressed={lang === language.code}
            onClick={() => setLang(language.code)}
          >
            {language.code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
