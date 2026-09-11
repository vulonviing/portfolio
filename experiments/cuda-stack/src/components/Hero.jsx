import './Hero.css';
import { useLang } from '../i18n/LanguageProvider';

export default function Hero() {
  const { t } = useLang();

  return (
    <section className="hero">
      <div className="container hero__inner">
        <h1 className="hero__title">{t.hero.title}</h1>
        <p className="hero__lede">{t.hero.lede}</p>
        <div className="hero__hint">
          <span className="hero__hint-mark" aria-hidden="true" />
          {t.hero.hint}
        </div>
      </div>
    </section>
  );
}
