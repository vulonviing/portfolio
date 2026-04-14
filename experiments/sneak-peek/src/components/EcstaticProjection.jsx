import { useMemo, useState } from 'react';
import { clamp, easeOvershoot, easeOutCubic } from '../utils/easing';
import { useAudio } from '../audio/AudioProvider';
import { useLang } from '../i18n/LanguageProvider';
import './EcstaticProjection.css';

function deriveMood(minute, choice) {
  if (choice === 'quit') return 'collapse';
  if (minute < 35) return 'firstHalf';
  if (minute < 65) return 'halftime';
  return 'finalTen';
}

const WIDTH = 800;
const HEIGHT = 280;
const MATCH_MIN = 0;
const MATCH_MAX = 95;

export default function EcstaticProjection() {
  const [minute, setMinute] = useState(70);
  const [choice, setChoice] = useState('fight'); // 'fight' | 'quit'
  const { pushScenario } = useAudio();
  const { t } = useLang();
  const tp = t.projection;

  const data = useMemo(
    () => computeProjection(minute, choice),
    [minute, choice],
  );

  const handleMinute = (v) => {
    setMinute(v);
    pushScenario(deriveMood(v, choice));
  };

  const handleChoice = (c) => {
    setChoice(c);
    pushScenario(deriveMood(minute, c));
  };

  return (
    <section id="projection" className="projection section">
      <div className="section__eyebrow">{tp.eyebrow}</div>
      <h2 className="section__title">{tp.title}</h2>
      <p className="section__lede">
        {tp.lede[0]} <strong>{tp.lede[1]}</strong> {tp.lede[2]}
      </p>

      <div className="projection__controls">
        <label className="projection__slider">
          <span className="projection__slider-label">
            {tp.sliderLabel}: <strong>{minute}&apos;</strong>
          </span>
          <input
            type="range"
            min={MATCH_MIN}
            max={MATCH_MAX}
            value={minute}
            onChange={(e) => handleMinute(Number(e.target.value))}
          />
          <div className="projection__slider-ticks">
            <span>0&apos;</span>
            <span>45&apos;</span>
            <span>70&apos;</span>
            <span>90&apos;</span>
          </div>
        </label>

        <div className="projection__choices" role="radiogroup">
          <button
            role="radio"
            aria-checked={choice === 'quit'}
            className={`projection__choice projection__choice--quit ${
              choice === 'quit' ? 'is-active' : ''
            }`}
            onClick={() => handleChoice('quit')}
          >
            <span className="projection__choice-title">{tp.quit.title}</span>
            <span className="projection__choice-sub">{tp.quit.sub}</span>
          </button>
          <button
            role="radio"
            aria-checked={choice === 'fight'}
            className={`projection__choice projection__choice--fight ${
              choice === 'fight' ? 'is-active' : ''
            }`}
            onClick={() => handleChoice('fight')}
          >
            <span className="projection__choice-title">{tp.fight.title}</span>
            <span className="projection__choice-sub">{tp.fight.sub}</span>
          </button>
        </div>
      </div>

      <div className="projection__chart-wrap">
        <svg
          className="projection__chart"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={tp.chartAria}
        >
          <defs>
            <linearGradient id="spirit-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffb400" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffb400" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="score-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b31237" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#b31237" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* grid */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={i}
              x1={(WIDTH / 9) * i}
              x2={(WIDTH / 9) * i}
              y1={0}
              y2={HEIGHT}
              stroke="rgba(255,255,255,0.04)"
            />
          ))}
          <line
            x1={0}
            x2={WIDTH}
            y1={HEIGHT - 1}
            y2={HEIGHT - 1}
            stroke="rgba(255,255,255,0.08)"
          />

          {/* Decision vertical */}
          <line
            x1={data.decisionX}
            x2={data.decisionX}
            y1={0}
            y2={HEIGHT}
            stroke="rgba(255,180,0,0.45)"
            strokeDasharray="4 4"
          />

          {/* Spirit area */}
          <path
            d={`${data.spiritPath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`}
            fill="url(#spirit-grad)"
            opacity="0.35"
          />
          {/* Spirit line */}
          <path
            d={data.spiritPath}
            fill="none"
            stroke="#ffb400"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Score line */}
          <path
            d={data.scorePath}
            fill="none"
            stroke="#b31237"
            strokeWidth="2"
            strokeDasharray="2 3"
            strokeLinejoin="round"
          />

          {/* Decision marker */}
          <circle
            cx={data.decisionX}
            cy={data.decisionY}
            r="6"
            fill="#ffb400"
            stroke="#050816"
            strokeWidth="2"
          />

          <text
            x={data.decisionX + 10}
            y={Math.max(20, data.decisionY - 10)}
            fill="#ffb400"
            fontFamily="Oswald, sans-serif"
            fontSize="14"
            letterSpacing="1"
          >
            {minute}&apos; {tp.decision}
          </text>
        </svg>

        <div className="projection__legend">
          <span className="projection__legend-item projection__legend-item--spirit">
            <span className="dot" />
            {tp.legend.spirit}
          </span>
          <span className="projection__legend-item projection__legend-item--score">
            <span className="dot" />
            {tp.legend.score}
          </span>
        </div>
      </div>

      <div className="projection__readout">
        <div
          className={`projection__stat ${
            choice === 'fight' ? 'is-up' : 'is-flat'
          }`}
        >
          <div className="projection__stat-label">{tp.stats.score}</div>
          <div className="projection__stat-value">
            {data.scoreEnd.toFixed(1)}
          </div>
          <div className="projection__stat-note">{tp.stats.scoreNote}</div>
        </div>
        <div
          className={`projection__stat ${
            choice === 'fight' ? 'is-up' : 'is-down'
          }`}
        >
          <div className="projection__stat-label">{tp.stats.spirit}</div>
          <div className="projection__stat-value">{data.spiritEnd.toFixed(1)}</div>
          <div className="projection__stat-note">{tp.stats.spiritNote}</div>
        </div>
      </div>
    </section>
  );
}

function computeProjection(minute, choice) {
  const steps = 60;
  const scorePts = [];
  const spiritPts = [];
  const decisionT = clamp(minute / MATCH_MAX, 0, 1);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mx = t * WIDTH;

    // Score line — slow linear-ish, similar under both choices
    // Team is losing 0-2 baseline — slight recovery if fight past decision
    const baseScore = 0.55 - t * 0.12;
    const postDecision = t > decisionT ? (t - decisionT) : 0;
    const scoreBoost =
      choice === 'fight' ? easeOutCubic(postDecision / (1 - decisionT + 0.01)) * 0.18 : 0;
    const scoreY = (1 - clamp(baseScore + scoreBoost, 0, 1)) * HEIGHT;
    scorePts.push([mx, scoreY]);

    // Spirit line — fight: climbs after decision. quit: collapses.
    let spirit;
    if (t <= decisionT) {
      spirit = 0.48 + 0.12 * Math.sin(t * 6);
    } else {
      const p = (t - decisionT) / (1 - decisionT + 0.001);
      if (choice === 'fight') {
        spirit = 0.5 + easeOvershoot(clamp(p, 0, 1)) * 0.42;
      } else {
        spirit = 0.48 - easeOutCubic(clamp(p, 0, 1)) * 0.44;
      }
    }
    const spiritY = (1 - clamp(spirit, 0.02, 0.98)) * HEIGHT;
    spiritPts.push([mx, spiritY]);
  }

  const toPath = (pts) =>
    pts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(' ');

  const decisionX = decisionT * WIDTH;
  const decisionY =
    spiritPts[Math.round(decisionT * steps)]?.[1] ?? HEIGHT / 2;
  const spiritEnd = 1 - spiritPts[spiritPts.length - 1][1] / HEIGHT;
  const scoreEnd = 1 - scorePts[scorePts.length - 1][1] / HEIGHT;

  return {
    scorePath: toPath(scorePts),
    spiritPath: toPath(spiritPts),
    decisionX,
    decisionY,
    spiritEnd: spiritEnd * 10,
    scoreEnd: scoreEnd * 10,
  };
}
