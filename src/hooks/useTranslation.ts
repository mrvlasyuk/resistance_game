import { useMemo } from 'react';
import enTranslations from '../i18n/en.json';
import ruTranslations from '../i18n/ru.json';
import { useGameStore } from '../store/gameStore';

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;

const translations = {
  en: (enTranslations as any)?.default ?? enTranslations,
  ru: (ruTranslations as any)?.default ?? ruTranslations,
};

export function useTranslation() {
  const language = useGameStore((state) => state.language);

  const t = useMemo(() => {
    return (key: TranslationKey, params?: TranslationParams): string => {
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }
      
      if (typeof value !== 'string') {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
      }
      
      // Replace parameters in the translation
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }
      
      return value;
    };
  }, [language]);

  return { t, language };
} 
