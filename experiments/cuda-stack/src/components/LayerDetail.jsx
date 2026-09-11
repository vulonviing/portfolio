import { forwardRef, useState } from 'react';
import './LayerDetail.css';
import { useLang } from '../i18n/LanguageProvider';
import { glossary } from '../data/glossary';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import CodeBlock from './CodeBlock';
import LayerAnimation from './LayerAnimation';

const LayerDetail = forwardRef(function LayerDetail({ layer, copy, isActive }, ref) {
  const { lang, t } = useLang();
  const reducedMotion = usePrefersReducedMotion();
  const [codeOpen, setCodeOpen] = useState(false);
  const [activeTerm, setActiveTerm] = useState(null);
  const definition = activeTerm && (glossary[activeTerm]?.[lang] ?? glossary[activeTerm]?.en);

  return (
    <section ref={ref} className="layer-detail" id={`layer-${layer.id}`}>
      <div className="layer-detail__number">{layer.number}</div>
      <h3 className="layer-detail__title">{copy.title}</h3>

      <div className="term-row layer-detail__terms">
        {layer.terms.map((term) => (
          <button
            type="button"
            key={term}
            className={`term${activeTerm === term ? ' is-active' : ''}`}
            aria-expanded={activeTerm === term}
            onClick={() => setActiveTerm(activeTerm === term ? null : term)}
          >
            {term}
          </button>
        ))}
      </div>
      {definition && (
        <div className="term-definition" role="region">
          <strong>{activeTerm}</strong>
          <p>{definition}</p>
        </div>
      )}

      <p className="layer-detail__body">{copy.body}</p>

      <LayerAnimation config={layer.animation} active={isActive && !reducedMotion} />

      <button
        type="button"
        className="layer-detail__code-toggle"
        aria-expanded={codeOpen}
        onClick={() => setCodeOpen((open) => !open)}
      >
        {codeOpen ? t.stack.codeToggle.hide : t.stack.codeToggle.show}
      </button>
      <div className={`code-collapse${codeOpen ? ' is-open' : ''}`}>
        <div>
          <CodeBlock code={layer.code} />
        </div>
      </div>

      <p className="layer-detail__summary">{copy.summary}</p>
    </section>
  );
});

export default LayerDetail;
