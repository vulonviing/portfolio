import { useState } from 'react';
import { useLang } from '../i18n/LanguageProvider';
import './BrainMap.css';

const regions = [
  {
    id: 'risk',
    angle: -90,
    radius: 0.82,
    color: '#ff7a3c',
  },
  {
    id: 'motivation',
    angle: -30,
    radius: 0.9,
    color: '#ffb400',
  },
  {
    id: 'strategy',
    angle: 40,
    radius: 0.92,
    color: '#6a8dff',
  },
  {
    id: 'outburst',
    angle: 115,
    radius: 0.88,
    color: '#b31237',
  },
  {
    id: 'calm',
    angle: 180,
    radius: 0.85,
    color: '#f5f5f5',
  },
  {
    id: 'memory',
    angle: 235,
    radius: 0.88,
    color: '#ffd97a',
  },
];

export default function BrainMap() {
  const { t } = useLang();
  const [active, setActive] = useState('motivation');
  const node = regions.find((r) => r.id === active) ?? regions[0];
  const activeRegion = t.regions[node.id] ?? t.regions.motivation;

  return (
    <section id="brain" className="brain section">
      <div className="section__eyebrow">{t.brain.eyebrow}</div>
      <h2 className="section__title">{t.brain.title}</h2>
      <p className="section__lede">{t.brain.lede}</p>

      <div className="brain__wrap">
        <div className="brain__stage">
          <svg
            viewBox="-115 -115 230 230"
            className="brain__svg"
            role="img"
            aria-label={t.brain.mapAria}
          >
            <defs>
              <radialGradient id="brain-bg" cx="0" cy="0" r="1">
                <stop offset="0%" stopColor="rgba(255,180,0,0.18)" />
                <stop offset="60%" stopColor="rgba(255,180,0,0.04)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            {/* ambient */}
            <circle cx="0" cy="0" r="95" fill="url(#brain-bg)" />
            <circle
              cx="0"
              cy="0"
              r="72"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="2 3"
            />
            <circle
              cx="0"
              cy="0"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="2 3"
            />

            {/* connections */}
            {regions.map((a, i) =>
              regions.slice(i + 1).map((b) => {
                const pa = polar(a.angle, a.radius * 80);
                const pb = polar(b.angle, b.radius * 80);
                const isActive = a.id === active || b.id === active;
                return (
                  <line
                    key={`${a.id}-${b.id}`}
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    stroke={isActive ? 'rgba(255,180,0,0.55)' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isActive ? 1 : 0.5}
                  />
                );
              }),
            )}

            {/* nodes */}
            {regions.map((r) => {
              const p = polar(r.angle, r.radius * 80);
              const isActive = r.id === active;
              const region = t.regions[r.id] ?? t.regions.motivation;
              return (
                <g
                  key={r.id}
                  transform={`translate(${p.x} ${p.y})`}
                  className={`brain__node ${isActive ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(r.id)}
                  onFocus={() => setActive(r.id)}
                  onClick={() => setActive(r.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={region.label}
                >
                  <circle
                    r={isActive ? 9 : 5}
                    fill={r.color}
                    opacity={isActive ? 0.95 : 0.85}
                  />
                  <circle
                    r={isActive ? 18 : 10}
                    fill="none"
                    stroke={r.color}
                    strokeWidth="0.8"
                    opacity={isActive ? 0.7 : 0.25}
                  />
                  <text
                    y={-14}
                    textAnchor="middle"
                    fontFamily="Oswald, sans-serif"
                    fontSize="6.5"
                    fill={isActive ? r.color : 'rgba(245,245,245,0.75)'}
                    letterSpacing="1"
                  >
                    {region.label.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* center */}
            <circle cx="0" cy="0" r="3" fill="#ffb400" />
            <text
              y="-8"
              textAnchor="middle"
              fontFamily="Bebas Neue, Oswald, sans-serif"
              fontSize="7"
              fill="#ffb400"
              letterSpacing="2"
            >
              {t.brain.center}
            </text>
          </svg>
        </div>

        <aside className="brain__panel">
          <div
            className="brain__panel-chip"
            style={{ color: node.color, borderColor: node.color }}
          >
            {activeRegion.label}
          </div>
          <p className="brain__panel-text">{activeRegion.description}</p>
          <div className="brain__panel-footer">{t.brain.footer}</div>
        </aside>
      </div>
    </section>
  );
}

function polar(deg, r) {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}
