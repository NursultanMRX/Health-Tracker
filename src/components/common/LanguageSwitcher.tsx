import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export default function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: t('languageNames.english') },
    { code: 'kaa', label: t('languageNames.karakalpak') },
    { code: 'ru', label: t('languageNames.russian') },
    { code: 'uz', label: t('languageNames.uzbek') }
  ];

  const handleLanguageChange = (langCode: string) => {
    // Change language in i18n
    i18n.changeLanguage(langCode);

    // Save to localStorage for persistence
    localStorage.setItem('app_language', langCode);

    // Call parent callback
    onLanguageChange(langCode);
  };

  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Languages className="w-4 h-4 text-gray-500" />
        <p className="text-xs font-medium text-gray-700">{t('profileMenu.language')}</p>
      </div>
      <div className="flex flex-col gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all active-language ${
              currentLanguage === lang.code
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
