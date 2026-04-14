import { useState } from 'react';
import { timePhases } from '../utils/notes';
import { timeModeColors } from '../utils/colors';
import { useAudio } from '../audio/AudioProvider';
import { useLang } from '../i18n/LanguageProvider';
import './TimeToggle.css';

export default function TimeToggle() {
  const [active, setActive] = useState('halftime');
  const { t } = useLang();
  const theme = timeModeColors[active] ?? timeModeColors.firstHalf;
  const tp = t.phases[active] ?? t.phases.firstHalf;
  const { pushScenario } = useAudio();

  const handlePhase = (id) => {
    setActive(id);
    pushScenario(id);
  };

  return (
    <section
      id="time"
      className={`time-toggle section time-toggle--${active}`}
      style={{
        '--phase-base': theme.base,
        '--phase-accent': theme.accent,
        '--phase-accent-soft': theme.accentSoft,
      }}
    >
      <div className="section__eyebrow">{t.time.eyebrow}</div>
      <h2 className="section__title">{t.time.title}</h2>
      <p className="section__lede">{t.time.lede}</p>

      <div className="time-toggle__tabs" role="tablist">
        {timePhases.map((p) => {
          const tph = t.phases[p.id] ?? p;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={active === p.id}
              onClick={() => handlePhase(p.id)}
              className={`time-toggle__tab ${
                active === p.id ? 'time-toggle__tab--active' : ''
              }`}
            >
              <span className="time-toggle__tab-min">{tph.minute}</span>
              <span className="time-toggle__tab-label">{tph.label}</span>
            </button>
          );
        })}
      </div>

      <div className="time-toggle__stage" aria-live="polite">
        <div className="time-toggle__glow" aria-hidden="true" />
        <div className="time-toggle__clock">
          <Clock id={active} minuteLabel={t.time.minute} />
        </div>

        <div className="time-toggle__body">
          <div className="time-toggle__mood">
            {t.time.moodLabel} · <em>{tp.mood}</em>
          </div>
          <h3 className="time-toggle__headline">{tp.headline}</h3>
          <p className="time-toggle__text">{tp.body}</p>
          <blockquote className="time-toggle__quote">{tp.quote}</blockquote>
        </div>
      </div>
    </section>
  );
}

function Clock({ id, minuteLabel = 'dk' }) {
  const angle =
    id === 'firstHalf' ? -60 : id === 'halftime' ? 0 : 120;
  const hand =
    id === 'firstHalf' ? 22 : id === 'halftime' ? 45 : 84;

  return (
    <div className="clock">
      <div className="clock__ring">
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className={`clock__tick ${i % 5 === 0 ? 'clock__tick--major' : ''}`}
            style={{ transform: `rotate(${i * 6}deg)` }}
          />
        ))}
      </div>
      <div
        className="clock__hand"
        style={{ transform: `rotate(${angle}deg)` }}
      />
      <div className="clock__center" />
      <div className="clock__readout">
        <span className="clock__minute">{hand}</span>
        <span className="clock__suffix">{minuteLabel}</span>
      </div>
    </div>
  );
}
