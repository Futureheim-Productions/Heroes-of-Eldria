import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import svCommon from './locales/sv/common.json';
import svHeroes from './locales/sv/heroes.json';
import svMonsters from './locales/sv/monsters.json';
import svItems from './locales/sv/items.json';
import svScreens from './locales/sv/screens.json';

import enCommon from './locales/en/common.json';
import enHeroes from './locales/en/heroes.json';
import enMonsters from './locales/en/monsters.json';
import enItems from './locales/en/items.json';
import enScreens from './locales/en/screens.json';

export const SCREEN_NAMESPACES = [
  'main-menu',
  'world-map',
  'dungeon',
  'combat',
  'inventory',
  'quests',
  'shop',
  'pvp',
  'guild',
  'settings',
  'profile',
  'mail',
  'formation',
] as const;

const resources = {
  sv: { common: svCommon, heroes: svHeroes, monsters: svMonsters, items: svItems, ...svScreens },
  en: { common: enCommon, heroes: enHeroes, monsters: enMonsters, items: enItems, ...enScreens },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'sv',
    supportedLngs: ['sv', 'en'],
    defaultNS: 'common',
    ns: ['common', 'heroes', 'monsters', 'items', ...SCREEN_NAMESPACES],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'fq_language',
    },
    react: { useSuspense: false },
  });

export default i18n;
