import { useEffect, useMemo, useState } from 'react';
import useCanvas from '../hooks/useCanvas';
import { momentumColors, hexToRgba } from '../utils/colors';
import { easeInOutCubic } from '../utils/easing';
import { chantBeats, scenarios, rhythmAt } from '../utils/notes';
import { useAudio } from '../audio/AudioProvider';
import { useLang } from '../i18n/LanguageProvider';
import './MelodyVisualizer.css';

export default function MelodyVisualizer() {
  const [scenario, setScenario] = useState('comeback');
  const [wonComeback, setWonComeback] = useState(false);
  const current = scenarios[scenario];
  const { pushScenario } = useAudio();
  const { t } = useLang();

  const scenarioOptions = [
    { id: 'comeback', label: t.melody.scenarios.comeback },
    { id: 'collapse', label: t.melody.scenarios.collapse },
    { id: 'grind', label: t.melody.scenarios.grind },
  ];

  const ts = t.scenarios[scenario];

  const handleScenario = (id) => {
    setScenario(id);
    pushScenario(id);
  };

  const COMEBACK_WIN_MS = 22000;
  useEffect(() => {
    setWonComeback(false);
    if (scenario !== 'comeback') return undefined;
    const t = setTimeout(() => setWonComeback(true), COMEBACK_WIN_MS);
    return () => clearTimeout(t);
  }, [scenario]);

  const hueKey = current.hue;
  const strokeColor = momentumColors[hueKey]?.line ?? '#ffb400';
  const glow = momentumColors[hueKey]?.glow ?? 'rgba(255,180,0,0.5)';

  const minutePoints = useMemo(() => {
    const pts = [];
    for (let m = 0; m <= 90; m += 1) {
      pts.push({ m, v: rhythmAt(m, scenario) });
    }
    return pts;
  }, [scenario]);

  const { canvasRef } = useCanvas(
    ({ ctx, width, height, time }) => {
      ctx.clearRect(0, 0, width, height);
      if (!width || !height) return;

      const padX = 40;
      const padY = 30;
      const innerW = width - padX * 2;
      const innerH = height - padY * 2;

      // Background grid — minute markers
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 9; i++) {
        const x = padX + (innerW / 9) * i;
        ctx.beginPath();
        ctx.moveTo(x, padY);
        ctx.lineTo(x, height - padY);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      ctx.moveTo(padX, height - padY);
      ctx.lineTo(width - padX, height - padY);
      ctx.stroke();

      // Draw 3 stacked waves with different frequencies to mimic stadium chant layers
      const layers = [
        { freq: 0.025, amp: 0.28, speed: 1.2, alpha: 0.35 },
        { freq: 0.055, amp: 0.18, speed: 2.1, alpha: 0.55 },
        { freq: 0.095, amp: 0.1, speed: 3.4, alpha: 0.8 },
      ];

      layers.forEach((layer, idx) => {
        ctx.beginPath();
        for (let x = 0; x <= innerW; x += 1) {
          const t = x / innerW;
          const minute = t * 90;
          const baseV = rhythmAt(minute, scenario);
          const wobble =
            Math.sin(x * layer.freq + time * layer.speed) *
            layer.amp *
            (0.4 + baseV);
          const y =
            padY +
            innerH * (1 - baseV) +
            wobble * innerH * 0.4 +
            (idx - 1) * 4;
          if (x === 0) ctx.moveTo(padX + x, y);
          else ctx.lineTo(padX + x, y);
        }
        ctx.strokeStyle = hexToRgba(strokeColor, layer.alpha);
        ctx.lineWidth = idx === 2 ? 2.2 : 1.2;
        ctx.shadowBlur = idx === 2 ? 14 : 0;
        ctx.shadowColor = glow;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Beat pulses — each chantBeat as a vertical pulse at its mid-minute
      chantBeats.forEach((beat) => {
        const midMinute = (beat.minute[0] + beat.minute[1]) / 2;
        const xT = midMinute / 90;
        const x = padX + innerW * xT;
        const targetV = beat.value;
        const pulse = 0.5 + 0.5 * Math.sin(time * 2 + midMinute * 0.2);
        const eased = easeInOutCubic(pulse);
        const barH = innerH * targetV * (0.45 + 0.55 * eased);
        const barY = height - padY - barH;
        const color = momentumColors[beat.color]?.line ?? strokeColor;
        const gx = ctx.createLinearGradient(x, barY, x, height - padY);
        gx.addColorStop(0, hexToRgba(color, 0.9));
        gx.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = gx;
        ctx.fillRect(x - 1.5, barY, 3, barH);
      });

      // Moving playhead
      const head = ((time * 0.09) % 1);
      const hx = padX + innerW * head;
      ctx.strokeStyle = hexToRgba(strokeColor, 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, padY);
      ctx.lineTo(hx, height - padY);
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(hx, padY + innerH * (1 - rhythmAt(head * 90, scenario)), 4, 0, Math.PI * 2);
      ctx.fill();
    },
    [scenario, strokeColor, glow],
  );

  return (
    <section id="melody" className="melody section">
      <div className="section__eyebrow">{t.melody.eyebrow}</div>
      <h2 className="section__title">{t.melody.title}</h2>
      <p className="section__lede">{t.melody.lede}</p>

      <div className="melody__controls" role="tablist">
        {scenarioOptions.map((o) => (
          <button
            key={o.id}
            role="tab"
            aria-selected={scenario === o.id}
            className={`melody__tab ${
              scenario === o.id ? 'melody__tab--active' : ''
            }`}
            onClick={() => handleScenario(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="melody__canvas-wrap">
        <canvas ref={canvasRef} className="melody__canvas" />
        <div className="melody__legend">
          {['0\'', '15\'', '30\'', '45\'', '60\'', '75\'', '90\''].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      <div className="melody__meta">
        <div className="melody__meta-name">{ts.name}</div>
        <p>{ts.description}</p>
        <div className="melody__beats">
          {minutePoints
            .filter((_, i) => i % 15 === 0)
            .map((p) => (
              <div key={p.m} className="melody__beat">
                <span className="melody__beat-min">{p.m}&apos;</span>
                <div
                  className="melody__beat-bar"
                  style={{
                    height: `${Math.round(p.v * 100)}%`,
                    background: strokeColor,
                    boxShadow: `0 0 18px ${glow}`,
                  }}
                />
              </div>
            ))}
        </div>
      </div>

      <div
        key={scenario}
        className="melody__verdicts"
        data-scenario={scenario}
        data-won={wonComeback ? 'true' : 'false'}
      >
        {current.verdicts.map((v) => {
          const verdict = ts.verdicts[v.kind] ?? v;
          return (
            <div key={v.kind} className={`verdict verdict--${v.kind}`}>
              <div className="verdict__label">{verdict.label}</div>
              <div className="verdict__line">{verdict.line}</div>
              <div className="verdict__quote">— {verdict.quote}</div>
              {v.kind === 'win' && scenario === 'comeback' && (
                <div className="verdict__progress" aria-hidden="true">
                  <div className="verdict__progress-bar" />
                  <span className="verdict__progress-label">
                    {wonComeback ? t.melody.winLabel : t.melody.winProgress}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
