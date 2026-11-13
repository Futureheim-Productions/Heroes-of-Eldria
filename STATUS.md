# Heroes of Eldria – Status mot implementationsplanen

Legend: ✅ klart · 🟡 delvis · ⬜ ej påbörjat

## 1. Projektsetup & Arkitektur (1–12)
| # | Punkt | Status | Kommentar |
|---|-------|--------|-----------|
| 1 | Vite + React + TS | ✅ | |
| 2 | Tailwind | ✅ | Tailwind v4 via `@tailwindcss/vite` + CSS-variabler i `@theme` |
| 3 | GSAP | ✅ | Skärm-, modal-, kort-, strids- och resursanimationer |
| 4 | Absoluta imports | ✅ | `@/…` |
| 5 | ESLint + Prettier + strict TS | ✅ | `npm run lint`, `npm run typecheck` |
| 6 | Mappstruktur | ✅ | Enligt arkitekturdokumentet |
| 7 | State | ✅ | Zustand + persist |
| 8 | Tema | ✅ | `src/styles/globals.css` |
| 9 | Safe area + landscape-lock | ✅ | `LandscapeGuard` + `screen.orientation.lock` där det stöds |
| 10 | Router med lazy loading | ✅ | React Router v7 (hash-router för Capacitor/file://) |
| 11 | LoadingScreen + ErrorBoundary | ✅ | |
| 12 | Backend-projekt | ⬜ | Se `FantasyQuest-Technical-Architecture.md` §3 |

## 2. Core Data Models (13–20)
| # | Punkt | Status | Kommentar |
|---|-------|--------|-----------|
| 13 | TS-interfaces | ✅ | `src/types/*` |
| 14 | Mock-data | ✅ | 10 hjältar, 32 monster, 36 items, 5 regioner × 5 nivåer |
| 15 | Rarity-system | ✅ | Common→Legendary med färgkoder |
| 16 | Currency-system | ✅ | Guld, ädelstenar, energi, nycklar, arenamynt, gillemynt |
| 17 | Inventory-modell | ✅ | Grid + utrustningsplatser per hjälte |
| 18 | Formation (5) | ✅ | |
| 19 | Save/Load | 🟡 | Lokalt (localStorage); server ⬜ |
| 20 | Stat-beräkning | ✅ | `utils/stats.ts` (nivå, stjärnor, utrustning, +förstärkning, set-bonus) |

## 3. UI Foundation (21–28)
| # | Punkt | Status |
|---|-------|--------|
| 21 | UI-komponenter | ✅ |
| 22 | Global Header | ✅ |
| 23 | Dark fantasy-tema | ✅ |
| 24 | GSAP-animationer | ✅ |
| 25 | Landscape-optimering | 🟡 testat 16:9 (800×373, 900×420) i browser; verkliga enheter ⬜ |
| 26 | Haptics | ✅ Vibration API på web, Capacitor Haptics när wrappad |
| 27 | Spinners/skeletons | ✅ |
| 28 | Debug-panel | ✅ Ctrl+Shift+D / 5 tryck i hörnet |

## 4. Vertical Slice (29–38)
| # | Punkt | Status | Kommentar |
|---|-------|--------|-----------|
| 29 | Huvudmeny | ✅ | Vertikal menylista, stor hjältebild, säsongskort + ÄVENTYR enligt referensmockupen |
| 30 | Hjältar-skärm | ✅ | Hjältelista | info + hjältebild | vertikala flikar (Info/Utrustning/Färdigheter/Uppgradera/Skins) enligt referensmockupen |
| 31 | Inventarie | ✅ | Filter, förstärk, utrusta, sälj, använd |
| 32 | Dungeon-select | ✅ | Normal/Svår, energikostnad, drops, rek. styrka |
| 33 | Turn-based combat | ✅ | Speed-gauge-turordning, 4 skills/hjälte, statuseffekter, summons, revive, auto, x1–x3 |
| 34 | Loot → inventory/currencies | ✅ | |
| 35 | Spara lokalt | ✅ | |
| 36 | Energy-system | ✅ | 1 energi / 3 min, max ökar med spelarnivå |
| 37 | Quest-log | ✅ | 11 huvud, 5 sido, 4 dagliga, 3 veckovisa |
| 38 | Hela loopen testad | ✅ | I browser + vitest |

## 5. Fullständiga skärmar (39–52)
| # | Punkt | Status | Kommentar |
|---|-------|--------|-----------|
| 39 | Världskarta | ✅ | Norsheim, Eldria, Skuggmarkerna, Isvidderna, Stjärnfallet |
| 40 | Quest Hub | ✅ | |
| 41 | Butik | ✅ | Starter pack, dagliga, summon, currency (IAP = dev-stub) |
| 42 | Gacha | ✅ | Animation + pity (50) + 10x-garanti |
| 43 | PvP Arena | ✅ | Ranking + AI-motståndare, 5 strider/dag, arenabutik |
| 44 | Gille | ✅ | Gå med/skapa, bidrag, medlemslista, gillebutik |
| 45 | Hero Upgrade & Awakening | ✅ | Nivå (guld/XP-dryck), stjärnor (skärvor + kristaller), skills (böcker) |
| 46 | Equipment Enhance | ✅ | +15, set-bonusar (5 set) |
| 47 | Formation | ✅ | |
| 48 | Battle log/replay | 🟡 | Deterministisk seed + eventlogg finns i motorn; ingen UI |
| 49 | Settings | ✅ | Språk, ljud, namn, reset |
| 50 | Profil | ✅ | |
| 51 | Mail/Inbox | ✅ | Välkomst + dagliga inloggningsbelöningar |
| 52 | Event/Season-banner | ✅ | Statisk banner i huvudmenyn |

## 6. Backend & Persistens (53–60)
⬜ Ej påbörjat. All logik som ska flyttas till servern är samlad i `src/services/game.ts`.

## 7. Polish, Performance & Mobil (61–68)
| # | Punkt | Status |
|---|-------|--------|
| 61 | Bilder | 🟡 Hjältebilder för Arthen/Lyra/Kael (`public/heroes/`, frilagda via `scripts/hero-art.mjs`); övriga hjältar + monster använder procedurella porträtt |
| 62 | Code-splitting | ✅ Per skärm + vendor-chunks (~107 kB gz initial) |
| 63 | PWA | 🟡 Manifest + ikon; service worker ⬜ |
| 64–65 | Capacitor | 🟡 `capacitor.config.ts` klar, native-projekt ej genererade |
| 66–68 | Enhetstest / analytics / Sentry | ⬜ |

## 8–9. Monetisering, Live Ops, Test, Launch
| # | Punkt | Status |
|---|-------|--------|
| 70 | Soft + hard currency | ✅ |
| 73 | Daily login rewards | ✅ (via post, 7-dagars serie) |
| 75 | Unit-tests | ✅ combat-motor + stats (`npm test`) |
| 78 | Lokalisering sv/en | ✅ |
| 69, 71, 72, 74, 76, 77, 79–82 | | ⬜ |
