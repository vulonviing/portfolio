import './CallTrace.css';
import { useLang } from '../i18n/LanguageProvider';
import { trace } from '../data/trace';
import { layers } from '../data/layers';

const ROWS = ['host', 'device', 'return'];

export default function CallTrace() {
  const { t } = useLang();

  return (
    <section className="section call-trace">
      <div className="container">
        <div className="kicker">
          <span className="kicker__index">act 03</span>
          <span>{t.trace.title}</span>
        </div>
        <h2 className="section__title">{t.trace.lede}</h2>

        <div className="trace-flow">
          {ROWS.map((phase) => {
            const steps = trace.filter((step) => step.phase === phase);
            return (
              <div className={`trace-flow__row trace-flow__row--${phase}`} key={phase}>
                <span className="trace-flow__row-label">{t.trace.phases[phase]}</span>
                {steps.map((step) => {
                  const globalIndex = trace.indexOf(step);
                  const layer = layers.find((l) => l.id === step.layer);
                  return (
                    <div className="trace-flow__node" key={step.id}>
                      <span className="trace-flow__node-index">
                        {String(globalIndex + 1).padStart(2, '0')}
                      </span>
                      <code className="trace-flow__node-label">{t.trace.steps[step.id]}</code>
                      {layer && (
                        <span className="trace-flow__node-tag">
                          {t.stack.layers[layer.id].title}
                        </span>
                      )}
                    </div>
                  );
                })}
                {phase !== 'return' && (
                  <div className="trace-flow__drop" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        <p className="call-trace__closing">{t.trace.closing}</p>
      </div>
    </section>
  );
}
