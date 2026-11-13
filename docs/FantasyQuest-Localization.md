# Fantasy Quest – Localization (i18n)

**Primära språk:** Svenska (sv) + Engelska (en)  
**Rekommenderad library:** `react-i18next` + `i18next`  
**Alternativ:** LinguiJS (om du vill ha maximal performance + compile-time) eller Paraglide (modern compiler-first)

---

## 1. Rekommenderad lösning: react-i18next

### Varför just denna?
- Mest använda och stabila valet för React 2026
- Utmärkt stöd för **namespaces** (perfekt när du har många skärmar)
- Bra TypeScript-stöd
- Fungerar utmärkt med Vite + Capacitor
- Enkel att lazy-loada språk och namespaces
- Stöd för plural, interpolation, context, formatting

### Installation

```bash
npm install i18next react-i18next i18next-browser-languagedetector
# Valfritt men rekommenderas:
npm install i18next-http-backend          # om du vill ladda från server senare
```

---

## 2. Mappstruktur för översättningar

```
src/
└── locales/
    ├── sv/
    │   ├── common.json          # Knappar, generella texter, currencies
    │   ├── main-menu.json
    │   ├── heroes.json
    │   ├── inventory.json
    │   ├── combat.json
    │   ├── dungeon.json
    │   ├── quests.json
    │   ├── shop.json
    │   ├── pvp.json
    │   ├── guild.json
    │   ├── world-map.json
    │   └── settings.json
    └── en/
        ├── common.json
        ├── main-menu.json
        └── ... (samma struktur)
```

**Namespaces** = en fil per skärm/feature. Det håller filerna små och gör det lätt att underhålla.

---

## 3. Grundkonfiguration

**`src/i18n.ts`**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import svCommon from './locales/sv/common.json';
import svMainMenu from './locales/sv/main-menu.json';
// ... importera övriga sv-namespaces

import enCommon from './locales/en/common.json';
import enMainMenu from './locales/en/main-menu.json';
// ... 

const resources = {
  sv: {
    common: svCommon,
    'main-menu': svMainMenu,
    // ...
  },
  en: {
    common: enCommon,
    'main-menu': enMainMenu,
    // ...
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'sv',           // Svenska som default
    defaultNS: 'common',
    ns: ['common', 'main-menu', 'heroes', 'inventory', 'combat', /* ... */],
    
    interpolation: {
      escapeValue: false,        // React sköter XSS
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'fq_language',
    },

    react: {
      useSuspense: false,        // Viktigt för mobil / Capacitor
    },
  });

export default i18n;
```

Lägg sedan i `main.tsx` / `providers.tsx`:

```tsx
import './i18n';
```

---

## 4. Användning i komponenter

### Enkel text
```tsx
import { useTranslation } from 'react-i18next';

function MainMenu() {
  const { t } = useTranslation('main-menu');

  return (
    <h1>{t('title')}</h1>           // "Huvudmeny" / "Main Menu"
  );
}
```

### Med variabler
```tsx
t('welcome', { name: playerName })  
// "Välkommen, {{name}}!" → "Välkommen, Arthen!"
```

### Plural
```tsx
t('heroes_owned', { count: 12 })
// sv: "{{count}} hjälte" / "{{count}} hjältar"
```

### Flera namespaces samtidigt
```tsx
const { t } = useTranslation(['combat', 'common']);
t('combat:start_battle')
t('common:confirm')
```

### Byt språk
```tsx
const { i18n } = useTranslation();

const changeLanguage = (lng: 'sv' | 'en') => {
  i18n.changeLanguage(lng);
};
```

---

## 5. TypeScript-stöd (rekommenderas starkt)

Skapa `src/types/i18next.d.ts`:

```ts
import 'i18next';
import common from '../locales/sv/common.json';
import mainMenu from '../locales/sv/main-menu.json';
// ... importera alla

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      'main-menu': typeof mainMenu;
      // ...
    };
  }
}
```

Nu får du **autocomplete** och type-checking på alla nycklar.

---

## 6. Rekommenderad nyckelstruktur (exempel)

**`locales/sv/common.json`**
```json
{
  "confirm": "Bekräfta",
  "cancel": "Avbryt",
  "close": "Stäng",
  "loading": "Laddar...",
  "gold": "Guld",
  "gems": "Ädelstenar",
  "energy": "Energi",
  "level": "Nivå {{level}}",
  "max": "MAX"
}
```

**`locales/sv/main-menu.json`**
```json
{
  "title": "Huvudmeny",
  "adventure": "Äventyr",
  "heroes": "Hjältar",
  "inventory": "Inventarie",
  "shop": "Butik",
  "settings": "Inställningar",
  "season": "Säsong {{number}}",
  "play": "Spela"
}
```

**`locales/sv/combat.json`**
```json
{
  "start_battle": "Starta strid",
  "victory": "Seger!",
  "defeat": "Nederlag",
  "your_turn": "Din tur",
  "enemy_turn": "Fiendens tur",
  "damage": "{{value}} skada",
  "critical": "Kritisk träff!",
  "reward_gold": "+{{amount}} guld"
}
```

---

## 7. Bra praxis för spelet

1. **Aldrig hardkoda text** i komponenter – allt ska gå via `t()`.
2. Använd **namespaces** per feature/skärm.
3. Håll nycklarna korta och beskrivande (`victory`, inte `combat_screen_victory_title_text`).
4. Separera UI-text från spellore (lore kan ligga i egna filer eller CMS senare).
5. Formatera siffror och datum med `Intl` (via i18next eller native):
   ```ts
   new Intl.NumberFormat(i18n.language).format(12450) // 12 450 (sv) / 12,450 (en)
   ```
6. Spara valt språk i `localStorage` (görs automatiskt av LanguageDetector).
7. I Settings-skärmen: låt spelaren byta mellan Svenska / English.

---

## 8. Lazy loading av språk (för bättre prestanda)

Om spelet växer mycket kan du byta till HTTP-backend:

```ts
import HttpBackend from 'i18next-http-backend';

i18n.use(HttpBackend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  // ...
});
```

Då laddas bara det aktuella språket + de namespaces som behövs.

---

## 9. Alternativ om du vill ha modernare approach

| Library          | Fördelar                              | Nackdelar                     | Passar dig om...                  |
|------------------|---------------------------------------|-------------------------------|-----------------------------------|
| **react-i18next**| Mest populär, namespaces, stabil     | Lite större runtime           | Du vill ha säkert & beprövat     |
| **LinguiJS**     | Mycket liten bundle, compile-time    | Annan arbetsmodell (macros)   | Bundle size är kritiskt          |
| **Paraglide**    | Extrem type-safety + tree-shaking    | Nyare, mindre community       | Du gillar compiler-first         |
| **typesafe-i18n**| Minimal + 100% type-safe             | Mindre features               | Du vill ha absolut minst overhead|

**Mitt råd:** Börja med **react-i18next**. Det är det smidigaste för ett spel med många skärmar och namespaces.

---

## 10. Checklista – Localization

- [ ] Installera i18next + react-i18next
- [ ] Skapa `src/i18n.ts` + locales-mapp
- [ ] Lägg till TypeScript-deklarationer
- [ ] Flytta alla hårdkodade texter till JSON
- [ ] Lägg till språkväxlare i Settings
- [ ] Testa både sv och en på alla huvudskärmar
- [ ] Formatera siffror/valutor korrekt per språk
- [ ] (Senare) Lägg till fler språk vid behov

---