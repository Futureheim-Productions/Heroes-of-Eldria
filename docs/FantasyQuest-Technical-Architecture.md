# Fantasy Quest – Teknisk Arkitektur

**Stack:** React 19 + TypeScript + Vite + Zustand + GSAP + Tailwind + Capacitor  
**Backend:** FastAPI (Python) *eller* ASP.NET Core (C#)  
**Målplattform:** Landscape Mobile (iOS + Android via Capacitor) + PWA  
**Orientering:** Endast Landscape

---

## 1. Övergripande Systemöversikt

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   React UI  │  │  Zustand     │  │  GSAP Animations  │  │
│  │  (Screens)  │←→│  Stores      │←→│  + Transitions    │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  API Client     │                       │
│                   │  (Axios/Fetch)  │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTPS / JWT
┌────────────────────────────▼────────────────────────────────┐
│                         BACKEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth        │  │  Game Logic  │  │  Economy / Shop  │  │
│  │  (JWT)       │  │  Validation  │  │  Anti-cheat      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │   Database      │                       │
│                   │  (PostgreSQL)   │                       │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend-arkitektur

### 2.1 Mappstruktur (rekommenderad)

```
src/
├── app/                      # App shell
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx         # Zustand + Query + Theme
│   └── layout/
│       ├── RootLayout.tsx
│       ├── SafeArea.tsx
│       └── LandscapeGuard.tsx
│
├── features/                 # Feature-based (varje skärm = feature)
│   ├── main-menu/
│   ├── world-map/
│   ├── heroes/
│   ├── inventory/
│   ├── combat/
│   ├── dungeon/
│   ├── quests/
│   ├── shop/
│   ├── pvp/
│   ├── guild/
│   └── settings/
│
├── components/
│   ├── ui/                   # Design system (Button, Modal, ProgressBar...)
│   ├── game/                 # HeroCard, ItemSlot, CurrencyDisplay...
│   └── layout/               # Header, SidePanel, TabBar
│
├── stores/                   # Zustand stores
│   ├── playerStore.ts
│   ├── inventoryStore.ts
│   ├── heroStore.ts
│   ├── combatStore.ts
│   ├── uiStore.ts
│   └── index.ts
│
├── services/
│   ├── api/
│   │   ├── client.ts         # Axios instance + interceptors
│   │   ├── auth.ts
│   │   ├── player.ts
│   │   ├── inventory.ts
│   │   ├── combat.ts
│   │   └── shop.ts
│   ├── storage/              # IndexedDB / localStorage wrapper
│   └── haptics.ts
│
├── hooks/
│   ├── usePlayer.ts
│   ├── useInventory.ts
│   ├── useCombat.ts
│   ├── useGSAP.ts
│   └── useSafeArea.ts
│
├── types/
│   ├── hero.ts
│   ├── item.ts
│   ├── combat.ts
│   ├── quest.ts
│   ├── player.ts
│   └── api.ts
│
├── utils/
│   ├── stats.ts              # Beräkna ATK/HP/CRIT
│   ├── battle.ts             # Combat helpers
│   ├── format.ts
│   └── constants.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── styles/
    ├── globals.css
    ├── theme.css             # CSS variables (färger, spacing)
    └── animations.css
```

### 2.2 State Management (Zustand)

**Principer:**
- En store per domän (player, inventory, heroes, combat, ui)
- Immutable updates
- Selectors för performance
- Persist middleware för offline (delvis)

**Exempel på store-ansvar:**

| Store            | Ansvar                                      |
|------------------|---------------------------------------------|
| `playerStore`    | Level, XP, currencies, energy, profile      |
| `heroStore`      | Alla hjältar, formation, upgrades           |
| `inventoryStore` | Items, equipment, materials                 |
| `combatStore`    | Aktuell battle state, turordning, actions   |
| `uiStore`        | Modaler, loading, toasts, current screen    |
| `questStore`     | Aktiva quests, progress                     |

### 2.3 Routing & Navigation

- **TanStack Router** (rekommenderas) eller React Router v7
- Lazy loading per feature
- Nested routes där det passar (t.ex. `/heroes/:id`)
- Landscape guard på root-nivå

### 2.4 Animation & UI

- **GSAP** för:
  - Screen transitions
  - Modal enter/exit
  - Card animations
  - Combat hit effects
  - Currency gain popups
- **Tailwind** + CSS Variables för tema
- Design tokens: colors, spacing, radii, shadows
- Alla interaktiva element har press-states + haptics

### 2.5 Offline & Sync

```
Local (IndexedDB)  ←→  Sync Queue  ←→  Backend
       ↑                    │
   Optimistic UI            │
                            ▼
                    Conflict resolution
                    (server wins vid kritiskt)
```

- Viktig data (currencies, inventory) valideras alltid på server
- Combat kan köras offline och synkas efteråt (med server-validering)

---

## 3. Backend-arkitektur

### 3.1 Rekommenderad struktur (FastAPI-exempel)

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py      # JWT
│   │   └── database.py
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── player.py
│   │       ├── inventory.py
│   │       ├── heroes.py
│   │       ├── combat.py
│   │       ├── shop.py
│   │       ├── quests.py
│   │       └── guild.py
│   ├── models/               # SQLAlchemy / Pydantic
│   ├── schemas/
│   ├── services/             # Business logic
│   │   ├── combat_service.py
│   │   ├── economy_service.py
│   │   └── anti_cheat.py
│   └── utils/
├── alembic/                  # Migrations
└── tests/
```

### 3.2 Kärnprinciper på backend

1. **All kritisk logik körs på servern**  
   (currency changes, loot rolls, combat rewards, purchases)
2. **Client skickar intent**, server returnerar resultat
3. **Idempotency keys** på köp och rewards
4. **Rate limiting** + basic anti-cheat (omöjliga stats, för snabb progress)
5. **Daily reset** styrs av server-tid

### 3.3 Databas (PostgreSQL)

**Huvudtabeller:**
- `users`
- `player_profiles`
- `heroes` (owned)
- `inventory_items`
- `equipment`
- `quests_progress`
- `guilds` + `guild_members`
- `transactions` (IAP + soft currency)
- `battle_logs` (valfritt)

---

## 4. Dataflöde – Exempel

### 4.1 Starta Dungeon → Combat → Reward

```
1. Client: POST /api/v1/dungeon/start { dungeonId, formation }
2. Server: Validerar energy, formation, skapar battle session
3. Server: Returnerar initial BattleState
4. Client: Kör combat lokalt (turn-based) med GSAP
5. Client: POST /api/v1/dungeon/complete { battleId, actions, result }
6. Server: Validerar actions + result, ger loot + XP + currencies
7. Server: Returnerar updated PlayerState + Inventory
8. Client: Uppdaterar stores + visar reward-animation
```

### 4.2 Köp i Shop

```
1. Client: POST /api/v1/shop/purchase { offerId, receipt? }
2. Server: Validerar offer + (vid IAP) verifierar kvitto
3. Server: Ger items/currencies atomiskt
4. Client: Optimistic update + bekräftelse
```

---

## 5. Capacitor & Mobil

```
React App (Vite)
      │
      ▼
Capacitor Bridge
      │
┌─────┴─────┐
│  iOS      │  Android
│  (Swift)  │  (Kotlin)
└───────────┘
```

**Viktiga plugins:**
- `@capacitor/status-bar`
- `@capacitor/splash-screen`
- `@capacitor/haptics`
- `@capacitor/preferences` (eller IndexedDB)
- `@capacitor/app` (back button, app state)
- RevenueCat eller Capacitor Purchases för IAP

**Landscape lock:**  
Sätts både i `capacitor.config.ts` och native projektfiler.

---

## 6. Säkerhet & Anti-cheat (grundnivå)

| Lager          | Åtgärd                                      |
|----------------|---------------------------------------------|
| Client         | Ingen känslig logik, bara presentation      |
| Transport      | HTTPS + JWT                                 |
| Server         | All currency/loot/combat validation         |
| Economy        | Server-side balances + transaction log      |
| Rate limit     | Per endpoint + per user                     |
| Replay         | Battle actions loggas och kan granskas      |

---

## 7. Performance-riktlinjer

- Code splitting per feature (React.lazy)
- Bilder i WebP + lazy loading
- Virtuell lista för stora inventory/hero-listor (om behövs)
- GSAP: använd `will-change` sparsamt, städa timelines
- Undvik onödiga re-renders (Zustand selectors)
- Bundle size: håll initial load under ~300–400 kB gzippat

---

## 8. Utvecklings- & Deploy-flöde

```
Local Dev (Vite)
      │
      ▼
GitHub → CI (lint, typecheck, tests)
      │
      ▼
Preview (Vercel / Cloudflare Pages)   ← Web/PWA
      │
      ▼
Capacitor build → TestFlight / Internal Testing
      │
      ▼
App Store + Google Play
```

**Backend:**  
Railway / Render / Fly.io / Azure (beroende på om du kör Python eller C#)

---

## 9. Viktiga tekniska beslut (sammanfattning)

| Område              | Val                          | Motivering                              |
|---------------------|------------------------------|-----------------------------------------|
| UI Framework        | React 19 + TS                | Din styrka + ekosystem                  |
| State               | Zustand                      | Enkelt, snabbt, bra för spel            |
| Animation           | GSAP                         | Du kan redan + kraftfullt               |
| Styling             | Tailwind + CSS Variables     | Snabbt + konsekvent tema                |
| Routing             | TanStack Router              | Type-safe + bra DX                      |
| Offline             | IndexedDB + sync queue       | Mobilvänligt                            |
| Native wrapper      | Capacitor                    | Samma kodbas → iOS + Android            |
| Backend             | FastAPI *eller* ASP.NET      | Välj efter din komfort                  |
| Databas             | SQLite för dev PostgreSQL    | SQLITE-Dev & PostgreSQL-Release         |
| Auth                | JWT                          | Enkelt att börja med                    |

---

## 10. Nästa steg efter denna arkitektur

1. Skapa projektet enligt mappstrukturen ovan
2. Sätt upp Zustand stores + grundläggande types
3. Bygg Design System (ui-komponenter)
4. Implementera Vertical Slice enligt planen
5. Koppla minimal backend för auth + player save