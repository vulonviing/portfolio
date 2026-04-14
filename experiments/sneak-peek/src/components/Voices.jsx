import { useMemo, useState } from 'react';
import { useLang } from '../i18n/LanguageProvider';
import './Voices.css';

const positions = [
  { top: '12%', left: '8%', rot: -6 },
  { top: '18%', right: '10%', rot: 5 },
  { top: '42%', left: '4%', rot: -3 },
  { top: '46%', right: '6%', rot: 4 },
  { top: '70%', left: '14%', rot: -5 },
  { top: '74%', right: '16%', rot: 3 },
  { top: '8%', left: '40%', rot: 2 },
];

const MAX_DOUBTERS = positions.length;
const TOTAL_VOICES = MAX_DOUBTERS + 1;

export default function Voices() {
  const { t } = useLang();
  const [doubters, setDoubters] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [quoteReady, setQuoteReady] = useState(false);
  const doubterLines = t.voices.doubters;

  const remainingIndices = useMemo(
    () =>
      doubterLines
        .map((_, index) => index)
        .filter((index) => !doubters.some((d) => d.index === index)),
    [doubterLines, doubters],
  );

  const handleSummon = () => {
    if (revealed) return;
    if (doubters.length >= MAX_DOUBTERS) {
      setQuoteReady(false);
      setRevealed(true);
      return;
    }
    const pool =
      remainingIndices.length
        ? remainingIndices
        : doubterLines.map((_, index) => index);
    const index = pool[Math.floor(Math.random() * pool.length)];
    const pos = positions[doubters.length];
    setDoubters([
      ...doubters,
      { id: Date.now() + Math.random(), index, pos },
    ]);
  };

  const handleReset = () => {
    if (!quoteReady) return;
    setDoubters([]);
    setRevealed(false);
    setQuoteReady(false);
  };

  return (
    <section id="voices" className="voices section">
      <div className="section__eyebrow">{t.voices.eyebrow}</div>
      <h2 className="section__title">{t.voices.title}</h2>
      <p className="section__lede">{t.voices.lede}</p>

      <div
        className={`voices__stage ${revealed ? 'is-revealed' : ''}`}
        data-count={doubters.length}
      >
        {doubters.map((d) => (
          <figure
            key={d.id}
            className="doubter"
            style={{
              top: d.pos.top,
              left: d.pos.left,
              right: d.pos.right,
              transform: `rotate(${d.pos.rot}deg)`,
            }}
          >
            <span className="doubter__silhouette" aria-hidden="true" />
            <blockquote className="doubter__text">
              {doubterLines[d.index]}
            </blockquote>
          </figure>
        ))}

        {revealed && (
          <div className="terim">
            <span className="terim__halo" aria-hidden="true" />
            <blockquote
              className="terim__quote"
              onAnimationEnd={() => setQuoteReady(true)}
            >
              {t.voices.terimQuote.part1}{' '}
              <span className="terim__dark">{t.voices.terimQuote.dark}</span>{' '}
              {t.voices.terimQuote.part2}{' '}
              <span className="terim__gold">{t.voices.terimQuote.gold}</span>{' '}
              <span className="terim__red">{t.voices.terimQuote.red}</span>
            </blockquote>
            <span className="terim__silhouette" aria-hidden="true" />
          </div>
        )}

        {!doubters.length && !revealed && (
          <div className="voices__hint">{t.voices.hint}</div>
        )}
      </div>

      <div className="voices__controls">
        {!revealed ? (
          <button
            type="button"
            className="voices__button"
            onClick={handleSummon}
          >
            {doubters.length === 0
              ? `${t.voices.button.start} (0/${TOTAL_VOICES})`
              : `${t.voices.button.more} (${doubters.length}/${TOTAL_VOICES})`}
          </button>
        ) : (
          <button
            type="button"
            className="voices__button voices__button--ghost"
            onClick={handleReset}
            disabled={!quoteReady}
          >
            {t.voices.reset}
          </button>
        )}
      </div>
    </section>
  );
}
