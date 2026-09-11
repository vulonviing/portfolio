import './SiteFooter.css';
import { useLang } from '../i18n/LanguageProvider';

export default function SiteFooter() {
  const { t } = useLang();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <a className="site-footer__back" href="/">
          {t.footer.back}
        </a>
      </div>
    </footer>
  );
}
