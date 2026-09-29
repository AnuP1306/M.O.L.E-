import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      type="button"
      className="language-switcher"
      onClick={toggleLanguage}
      title={language === 'en' ? 'Switch to Hindi' : 'अंग्रेज़ी में बदलें'}
      aria-label={language === 'en' ? 'Switch to Hindi' : 'अंग्रेज़ी में बदलें'}
    >
      <Languages size={14} />
      <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
    </button>
  );
}
