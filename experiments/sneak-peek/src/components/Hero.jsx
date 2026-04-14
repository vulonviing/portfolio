import { useEffect, useRef } from 'react';
import useCanvas from '../hooks/useCanvas';
import { palette } from '../utils/colors';
import { useLang } from '../i18n/LanguageProvider';
import './Hero.css';

export default function Hero() {
  const rootRef = useRef(null);
  const { t } = useLang();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const t = setTimeout(() => el.classList.add('hero--enter'), 60);
    return () => clearTimeout(t);
  }, []);

  const { canvasRef } = useCanvas(({ ctx, width, height, time }) => {
    ctx.clearRect(0, 0, width, height);

    // Ambient gradient wash — soft stadium light
    const gx = ctx.createRadialGradient(
      width * 0.2,
      height * 0.2,
      0,
      width * 0.2,
      height * 0.2,
      Math.max(width, height) * 0.7,
    );
    gx.addColorStop(0, 'rgba(255, 180, 0, 0.14)');
    gx.addColorStop(1, 'rgba(5, 8, 22, 0)');
    ctx.fillStyle = gx;
    ctx.fillRect(0, 0, width, height);

    const gx2 = ctx.createRadialGradient(
      width * 0.85,
      height * 0.75,
      0,
      width * 0.85,
      height * 0.75,
      Math.max(width, height) * 0.7,
    );
    gx2.addColorStop(0, 'rgba(179, 18, 55, 0.18)');
    gx2.addColorStop(1, 'rgba(5, 8, 22, 0)');
    ctx.fillStyle = gx2;
    ctx.fillRect(0, 0, width, height);

    // Subtle crowd pulse — light columns swaying
    const cols = 14;
    for (let i = 0; i < cols; i++) {
      const phase = i * 0.7 + time * 0.6;
      const sway = Math.sin(phase) * 0.5 + 0.5;
      const x = (width / cols) * i + width / cols / 2;
      const w = (width / cols) * 0.42;
      const h = height * (0.2 + 0.12 * sway);
      const y = height - h;
      const alpha = 0.04 + 0.06 * sway;
      ctx.fillStyle = `rgba(255, 180, 0, ${alpha})`;
      ctx.fillRect(x - w / 2, y, w, h);
    }

    // Horizon line
    ctx.strokeStyle = 'rgba(255, 180, 0, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.78);
    ctx.lineTo(width, height * 0.78);
    ctx.stroke();
    void palette;
  });

  return (
    <header id="top" className="hero" ref={rootRef}>
      <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
      <div className="hero__vignette" aria-hidden="true" />

      <div className="hero__inner">
        <div className="hero__eyebrow">{t.hero.eyebrow}</div>

        <h1 className="hero__title">
          <span className="hero__line hero__line--soft">
            {t.hero.titleA} <em>{t.hero.titleAEm}</em>
          </span>
          <span className="hero__line hero__line--hard">
            {t.hero.titleB} <u>{t.hero.titleBU}</u> {t.hero.titleBRest}
          </span>
          <span className="hero__line hero__line--accent">
            {t.hero.titleC}
          </span>
        </h1>

        <p className="hero__lede">
          {t.hero.lede[0]} <strong>{t.hero.lede[1]}</strong> {t.hero.lede[2]}{' '}
          <strong>{t.hero.lede[3]}</strong> {t.hero.lede[4]}
        </p>

        <div className="hero__cta">
          <a
            href="#melody"
            className="hero__btn"
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector('#melody')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t.hero.cta}
          </a>
          <div className="hero__hint">
            <span className="hero__hint-dot" />
            {t.hero.hint}
          </div>
        </div>
      </div>
    </header>
  );
}
