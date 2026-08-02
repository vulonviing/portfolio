import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';
import './Nav.css';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <a aria-label="Sneak Peek" href="#top" className="nav__logo" onClick={(e) => handleClick(e, '#top')}>
          <span aria-hidden="true">SNEAK</span>
          <span aria-hidden="true">PEEK</span>
        </a>

        <div className="nav__aux">
          <div className="nav__language">
            <LanguageSwitcher inline ariaLabel={t.intro.languageLabel} />
          </div>
          <a className="nav__back" href="/" aria-label={t.nav.back}>
            <span className="nav__back-label">{t.nav.back}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
