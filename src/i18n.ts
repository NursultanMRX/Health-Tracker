import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import kaaTranslation from './locales/kaa/translation.json';
import ruTranslation from './locales/ru/translation.json';
import uzTranslation from './locales/uz/translation.json';

// Get saved language from localStorage or use default
const savedLanguage = localStorage.getItem('app_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      kaa: {
        translation: kaaTranslation
      },
      ru: {
        translation: ruTranslation
      },
      uz: {
        translation: uzTranslation
      }
    },
    lng: savedLanguage, // Use saved language or default
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
