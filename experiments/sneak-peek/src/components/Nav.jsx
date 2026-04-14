import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LanguageProvider';
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

  const links = [
    { href: '#melody', label: t.nav.links.melody },
    { href: '#time', label: t.nav.links.time },
    { href: '#projection', label: t.nav.links.projection },
    { href: '#voices', label: t.nav.links.voices },
    { href: '#brain', label: t.nav.links.brain },
  ];

  const handleClick = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__logo" onClick={(e) => handleClick(e, '#top')}>
          <span className="nav__logo-mark" aria-hidden="true" />
          <span className="nav__logo-text">{t.nav.logo}</span>
        </a>

        <ul className="nav__links">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => handleClick(e, l.href)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav__aux">
          <div className="nav__meta" title="React 19 + Vite 8">
            {t.nav.meta}
          </div>
          <a className="nav__back" href="/" aria-label={t.nav.back}>
            {t.nav.back}
          </a>
        </div>
      </div>
    </nav>
  );
}
