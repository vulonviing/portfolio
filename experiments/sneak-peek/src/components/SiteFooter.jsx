import { useLang } from '../i18n/LanguageProvider';

export default function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="site-footer">
      <h4>{t.footer.title}</h4>
      <p>{t.footer.text}</p>
      <p className="footer__tagline">{t.footer.tagline}</p>
    </footer>
  );
}
