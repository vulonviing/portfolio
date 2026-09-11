import './Nav.css';
import { useLang } from '../i18n/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';

export default function Nav() {
  const { t } = useLang();

  return (
    <header className="nav">
      <div className="container nav__inner">
        <a className="nav__back" href="/">
          {t.nav.back}
        </a>
        <div className="nav__brand" aria-hidden="true">
          cuda stack
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
