import { useMemo, useRef } from 'react';
import './StackScroller.css';
import { useLang } from '../i18n/LanguageProvider';
import { layers } from '../data/layers';
import useActiveLayer from '../hooks/useActiveLayer';
import LayerDetail from './LayerDetail';

export default function StackScroller() {
  const { t } = useLang();
  const sectionRefs = useMemo(() => layers.map(() => ({ current: null })), []);
  const activeIndex = useActiveLayer(sectionRefs);
  const railRef = useRef(null);

  const goTo = (index) => {
    sectionRefs[index]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="section stack" id="stack">
      <div className="container">
        <div className="kicker">
          <span className="kicker__index">act 02</span>
          <span>{t.stack.title}</span>
        </div>
        <h2 className="section__title">{t.stack.lede}</h2>
        <p className="section__hint">{t.stack.hint}</p>
      </div>

      <div className="container stack__layout">
        <nav className="stack__rail" aria-label="Stack layers" ref={railRef}>
          <div className="stack__rail-track">
            {layers.map((layer, index) => (
              <button
                key={layer.id}
                type="button"
                className={`stack__node${index === activeIndex ? ' is-active' : ''}`}
                onClick={() => goTo(index)}
                aria-current={index === activeIndex}
              >
                <span className="stack__node-number">{layer.number}</span>
                <span className="stack__node-label">{t.stack.layers[layer.id].title}</span>
              </button>
            ))}
            <div
              className="stack__rail-fill"
              style={{ height: `${((activeIndex + 1) / layers.length) * 100}%` }}
              aria-hidden="true"
            />
          </div>
        </nav>

        <div className="stack__details">
          {layers.map((layer, index) => (
            <LayerDetail
              key={layer.id}
              layer={layer}
              copy={t.stack.layers[layer.id]}
              isActive={index === activeIndex}
              ref={(el) => {
                sectionRefs[index].current = el;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
