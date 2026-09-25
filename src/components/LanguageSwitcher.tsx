import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const language = event.target.value;

    void i18n.changeLanguage(language);
    localStorage.setItem('mole-language', language);
    document.documentElement.lang = language;
  }

  return (
    <label className="language-switcher">
      <select
        className="language-switcher__select"
        aria-label={t('language.label')}
        value={i18n.resolvedLanguage === 'hi' ? 'hi' : 'en'}
        onChange={handleChange}
      >
        <option value="en">{t('language.english')}</option>
        <option value="hi">{t('language.hindi')}</option>
      </select>
    </label>
  );
}