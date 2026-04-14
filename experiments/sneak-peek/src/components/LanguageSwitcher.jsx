import { useLang } from '../i18n/LanguageProvider';
import './LanguageSwitcher.css';

export default function LanguageSwitcher({
  inline = false,
  ariaLabel,
}) {
  const { lang, setLang, languages, t } = useLang();
  const groupLabel = ariaLabel ?? t.intro.languageLabel;

  return (
    <div
      className={`lang-switcher ${inline ? 'lang-switcher--inline' : ''}`}
      role="group"
      aria-label={groupLabel}
    >
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-switcher__btn ${
            lang === l.code ? 'is-active' : ''
          }`}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          title={l.label}
        >
          <span className="lang-switcher__flag" aria-hidden="true">
            {l.flag}
          </span>
          <span className="lang-switcher__code">{l.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
