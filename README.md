# Heroes of Eldria

Turn-based dark fantasy RPG för landscape-mobil, byggt med **React 19 + TypeScript + Vite + Zustand + GSAP + Tailwind v4 + react-i18next**.
Designdokumenten ligger i `FantasyQuest-*.md`; status per punkt i [STATUS.md](STATUS.md).

## Kom igång

```bash
npm install
npm run dev        # http://localhost:5173 (host: true → öppna från telefonen på samma nät)
```

Testa i Chrome DevTools: `F12` → `Ctrl+Shift+M` → välj telefon → rotera till landscape.
Debug-panel: `Ctrl+Shift+D` (eller 5 snabba tryck i övre vänstra hörnet) – ger resurser/alla hjältar i dev.

```bash
npm run typecheck  # tsc
npm run lint       # eslint
npm test           # vitest (combat-motor + stats)
npm run build      # produktionsbygge till dist/
```

## Struktur

```
src/
├── app/            App-shell, router (hash-router, lazy per skärm), ErrorBoundary, LoadingScreen
├── features/       En mapp per skärm: main-menu, world-map, dungeon, combat, heroes, inventory,
│                   quests, shop, pvp, guild, settings, profile, mail
├── components/     ui/ (Button, Modal, ProgressBar …), game/ (HeroCard, ItemCard, HeroPortrait), layout/
├── stores/         Zustand-stores med persist (player, heroes, inventory, quests, progress, combat, meta, ui)
├── services/       game.ts = all cross-store spellogik (belöningar, dungeon-flöde, gacha, uppgraderingar,
│                   daglig reset). Byts senare mot API-anrop. storage.ts, haptics.ts
├── utils/          battle.ts (ren, deterministisk combat-motor), stats.ts, constants.ts, rng.ts, format.ts
├── data/           Hjältar (10), monster (30+2 minions), items (36), regioner/stages (5×5), quests, butik
├── locales/        sv/ + en/ – namespaces per skärm (common, heroes, monsters, items, screens)
└── styles/         globals.css – tema-tokens (guld/lila/mörkblått/rött), safe-area, animationer
```

## Spelloop

Huvudmeny → Världskarta → Välj nivå (Normal/Svår) → Turordnad strid (manuell eller Auto, x1–x3) →
Belöningar (guld, XP, hjälte-XP, drops, första-klarnings-bonus) → Quests → Uppgradera hjältar/utrustning →
Framkalla nya hjältar (gacha med pity) → Arena (AI-motståndare) → Gille → Post.

All progress sparas lokalt i `localStorage` (`fq_*`-nycklar). Energi regenereras 1/3 min även offline.

## Hjälte- och monsterbilder

Prompts: `heroes_prompt.txt` (12 hjältar) och `monster_prompt.txt` (32 monster). Bilder genereras på vit
bakgrund – hjältar vända åt höger, monster åt vänster (de står till höger i striden).

| | Råbilder | Utdata | Kommando |
|---|---|---|---|
| Hjältar | `art/raw/<id>.png` | `public/heroes/` + `src/data/heroArt.ts` | `npm run hero-art` |
| Monster | `art/raw/monsters/<id>.png` | `public/monsters/` + `src/data/monsterArt.ts` | `npm run monster-art` |
| Skins | `art/raw/<heroId>_alt_<n>.png` | `public/heroes/<heroId>_alt_<n>.png` + `HERO_SKINS` | `npm run hero-art` |
| Spell-FX | `art/raw/fx/<id>.png` (3×3 sprite sheet) | `public/effects/` | `npm run fx-art` |
| Logo + menybakgrund | `art/raw/brand/logo.jpg`, `menu_background.jpg` | `public/logo.png`, `public/bg-menu.jpg` | `npm run brand-art` |
| Stage-bakgrunder | `art/raw/stages/<stageId>.jpg` | `public/stages/` + `src/data/stageArt.ts` | `npm run stage-art` |

Stage-bakgrunder: prompts i `stage_prompts/` (50 st, en per stage i `src/data/dungeons.ts`, namn i
`dungeon:stages.<id>.name` i `screens.json`). Till skillnad från hjälte-/monsterbilder är detta hela
scener utan vit bakgrund att frilägga – `scripts/stage-art.mjs` skalar bara om och komprimerar. Stages
utan egen bild i `public/stages/` faller tillbaka på standardbakgrunden `bg-battle.jpg` i striden.

Skriptet (`scripts/art.mjs`) frilägger vit bakgrund (redan transparenta bilder passerar orörda), gör
filnamnet till gemener och regenererar registret. Id:n som redan finns i `public/` hoppas över –
`npm run hero-art -- --force` gör om allt. Filer med `_alt` i namnet ignoreras. `./fastboot.sh` kör båda
automatiskt vid start. Figurer utan bild får ett procedurellt porträtt.

Skins: en hjälte med `nera_alt_1.png`, `nera_alt_2.png` i `public/heroes/` får dem som "Skin 1/2" under
fliken **Skins** i hjältevyn (`<id>_alt.png` utan nummer ignoreras som utkast). Valet sparas på `OwnedHero.skin`
och följer med överallt – porträtt, huvudmeny, strid – via `heroArt(id, skin)`.

Spell-FX (`scripts/fx.mjs`) skalar ner 9-slice-sheets (9 frames, vänster→höger, upp→ner) till 768 px
(`--size=N`) med alfa bevarad. Registrera sedan sheetet i `src/data/spellFx.ts` – en rad
`<id>: fx('<id>')` – och koppla via `ELEMENT_FX` (standard per element) eller per skill med `{ fx: '<id>' }`.
Effekterna spelas med GSAP (`src/hooks/useSpellSprite.ts`) vid fötterna bakom den träffade figuren.

## Nästa steg

- Backend (FastAPI/ASP.NET) enligt `FantasyQuest-Technical-Architecture.md` – `services/game.ts` är
  gränssnittet som ska bytas mot server-anrop.
- `npm i @capacitor/core @capacitor/cli && npx cap add android` – `capacitor.config.ts` finns redan.
- Riktiga bilder/ikoner (nu procedurella porträtt med emoji-glyfer), ljud, IAP (RevenueCat).
