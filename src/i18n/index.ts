import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';

const savedLanguage = localStorage.getItem('mole-language');
const initialLanguage = savedLanguage === 'hi' ? 'hi' : 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'hi'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;