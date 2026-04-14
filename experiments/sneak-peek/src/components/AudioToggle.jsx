import { useAudio } from '../audio/AudioProvider';
import { useLang } from '../i18n/LanguageProvider';
import './AudioToggle.css';

export default function AudioToggle() {
  const { enabled, starting, toggle } = useAudio();
  const { t } = useLang();
  const ta = t.audio;

  return (
    <button
      className={`audio-toggle ${enabled ? 'is-on' : ''} ${starting ? 'is-loading' : ''}`}
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? ta.turnOff : ta.turnOn}
      title={enabled ? ta.turnOff : ta.turnOnTitle}
    >
      <span className="audio-toggle__bars" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className="audio-toggle__label">
        {starting ? ta.starting : enabled ? ta.on : ta.off}
      </span>
    </button>
  );
}
