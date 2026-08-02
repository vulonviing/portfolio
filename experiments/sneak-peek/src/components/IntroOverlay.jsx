import { useEffect, useState } from 'react';
import { useAudio } from '../audio/AudioProvider';
import { useLang } from '../i18n/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';
import './IntroOverlay.css';

export default function IntroOverlay() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toggle, enabled } = useAudio();
  const { t } = useLang();
  const ti = t.intro;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 280);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = async (withSound) => {
    if (busy) return;
    try {
      if (withSound && !enabled) {
        setBusy(true);
        await toggle();
      }
    } finally {
      setBusy(false);
      setClosing(true);
      setTimeout(() => setVisible(false), 520);
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`intro ${closing ? 'intro--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
    >
      <div className="intro__backdrop" aria-hidden="true" />
      <div className="intro__card">
        <div className="intro__eyebrow">{ti.eyebrow}</div>
        <h2 className="intro__title" id="intro-title">
          {ti.title}
        </h2>
        <p className="intro__text">{ti.text}</p>

        <div className="intro__language">
          <span className="intro__language-label">{ti.languageLabel}</span>
          <LanguageSwitcher inline ariaLabel={ti.languageLabel} />
        </div>

        <div className="intro__actions">
          <button
            autoFocus
            className="intro__btn intro__btn--primary"
            onClick={() => dismiss(true)}
            disabled={busy}
          >
            <span className="intro__btn-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {busy ? ti.primaryBusy : ti.primary}
          </button>
          <button
            className="intro__btn"
            onClick={() => dismiss(false)}
            disabled={busy}
          >
            {ti.secondary}
          </button>
        </div>

        <div className="intro__hint">{ti.hint}</div>
      </div>
    </div>
  );
}
