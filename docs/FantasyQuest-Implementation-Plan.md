# Fantasy Quest – Implementation Plan (React / Web-first, Landscape Mobile)

**Mål:** Bygga ett landscape-mobilspel i stil med screenshoten utan traditionell spelmotor.  
**Stack:** React + TypeScript + Vite + GSAP + Tailwind (eller CSS Modules) + Capacitor (för native iOS/Android)  
**Backend:** Python (FastAPI) eller C# (ASP.NET Core) – välj det du är mest bekväm med.  
**Orientering:** Endast landscape (16:9 / 19.5:9).  
**Estimerad scope:** ~60–70 punkter. Börja med Vertical Slice (punkt 1–25) innan resten.

---

## 1. Projektsetup & Arkitektur (1–12)

1. Skapa monorepo med Vite + React + TypeScript.
2. Installera och konfigurera Tailwind CSS (eller CSS Modules + CSS Variables för tema).
3. Lägg till GSAP + @gsap/react för animationer.
4. Sätt upp absolut imports (`@/components`, `@/hooks`, `@/stores` osv).
5. Konfigurera ESLint + Prettier + strict TypeScript.
6. Skapa grundläggande mappstruktur:
   - `src/app` (routing & layout)
   - `src/features` (varje skärm = feature)
   - `src/components/ui` (knappar, modaler, progress bars)
   - `src/stores` (Zustand eller Redux Toolkit)
   - `src/types` (alla TypeScript-interfaces)
   - `src/services` (API-klient)
   - `src/hooks`
   - `src/assets`
7. Bestäm state-management: Zustand (rekommenderas) eller Redux Toolkit.
8. Skapa global Theme (färger, fonts, spacing) som matchar screenshotens dark fantasy-stil.
9. Implementera Safe Area + landscape-only lock (CSS + Capacitor).
10. Sätt upp React Router (eller TanStack Router) med lazy loading per skärm.
11. Skapa en enkel LoadingScreen + ErrorBoundary.
12. Bestäm backend: FastAPI (Python) eller ASP.NET Core Minimal API (C#). Skapa tomt projekt.

---

## 2. Core Data Models & Types (13–20)

13. Definiera TypeScript-interfaces för:
    - Hero (stats, stars, level, equipment, skills)
    - Item / Equipment (type, rarity, stats, upgrade level)
    - Quest / Mission
    - Dungeon / Stage
    - PlayerProfile (level, currencies, progress)
    - Guild
    - BattleState
14. Skapa mock-data för 8–12 hjältar, 30+ items, 5 dungeons.
15. Implementera rarity-system (Common → Legendary) med färgkoder.
16. Bygg Currency-system (Gold, Gems, Energy, Keys).
17. Skapa Inventory-modell (grid + equipped slots).
18. Definiera Battle-formation (5 hjältar max).
19. Skapa Save/Load-struktur (lokal + server).
20. Skriv utility-funktioner för stat-beräkning (ATK, HP, CRIT osv).

---

## 3. UI Foundation & Design System (21–28)

21. Bygg återanvändbara UI-komponenter:
    - Button (primary, secondary, danger, locked)
    - ProgressBar / ResourceBar
    - Modal / BottomSheet
    - TabBar / SideMenu
    - HeroCard / ItemCard
    - CurrencyDisplay
    - StarRating
22. Skapa global Header (nivå, currencies, settings).
23. Implementera dark fantasy-tema (guld, lila, mörkblått, rött).
24. Lägg till GSAP-animationer för:
    - Modal open/close
    - Card hover / press
    - Resource gain
    - Screen transitions
25. Gör alla skärmar 100% landscape-optimerade (testa på 16:9 och 19.5:9).
26. Implementera haptic feedback (Capacitor Haptics) på knappar.
27. Skapa Loading-spinners och skeleton-loaders.
28. Bygg en enkel Debug-panel (toggle med hemlig gesture).

---

## 4. Vertical Slice – Första fungerande loopen (29–38)

29. **Huvudmeny (Main Menu)**  
    Visa hjälte, nivå, currencies, knappar till Äventyr / Hjältar / Inventarie / Butik.
30. **Hjältar-skärm**  
    Lista alla ägda hjältar + detaljvy (stats, equipment, upgrade).
31. **Inventarie**  
    Grid + filter (Allt / Utrustning / Material) + equip/unequip.
32. **Enkel Dungeon-select**  
    Välj difficulty (Normal / Hard) och starta.
33. **Turn-based Combat (MVP)**  
    - 3 fiender vs 3–5 hjältar  
    - Turordning baserad på speed  
    - Auto-attack + 1 skill per hjälte  
    - Win/Lose-skärm med rewards
34. Koppla combat-resultat till inventory (loot) och currencies.
35. Spara progress lokalt (localStorage / IndexedDB).
36. Lägg till Energy-system (regenereras över tid).
37. Skapa Quest-log (minst 3 quests som ger rewards).
38. Testa hela loopen: Meny → Dungeon → Combat → Reward → Meny.

---

## 5. Fullständiga skärmar (39–52)

39. **Världskarta (World Map)**  
    Interaktiv karta med regioner (Norsheim, Eldria, etc.) + progress-indikatorer.
40. **Uppdrag / Quest Hub**  
    Huvuduppdrag + sidouppdrag + dagliga / veckovisa.
41. **Butik (Shop)**  
    - Starter Pack  
    - Dagliga erbjudanden  
    - Gacha / Summon (enkel version)  
    - Currency packs
42. **Gacha / Summon-system**  
    Animation + pity-system (valfritt i MVP).
43. **PvP Arena**  
    Enkel ranking + attackera AI-motståndare (senare riktiga spelare).
44. **Guild / Gille**  
    Skapa/gå med i guild, guild-shop, enkla bidrag.
45. **Hero Upgrade & Awakening**  
    Level up, star up, skill upgrade.
46. **Equipment Upgrade & Enhance**  
    + levels, refine, set-bonuses.
47. **Formation / Team Builder**  
    Dra-och-släpp eller klicka för att sätta 5 hjältar.
48. **Battle Replay / Log** (valfritt).
49. **Settings-skärm**  
    Ljud, språk (svenska/engelska), konto, logout.
50. **Profile / Stats-skärm**.
51. **Mail / Inbox-system** (rewards från events).
52. **Event / Season-banner** (Säsong 1, etc.).

---

## 6. Backend & Persistens (53–60)

53. Skapa REST API med:
    - Auth (JWT eller Firebase Auth)
    - Player profile CRUD
    - Inventory sync
    - Quest progress
    - Shop purchases
54. Implementera server-side validation av currencies och loot (anti-cheat grundnivå).
55. Lägg till offline-stöd + sync när online.
56. Skapa admin-endpoints (ge items, reset, etc.).
57. Implementera daily reset (server-tid).
58. Lägg till leaderboard för PvP (enkel version).
59. Säkerställ att alla kritiska actions går via server.
60. Sätt upp databas (PostgreSQL eller MongoDB).

---

## 7. Polish, Performance & Mobil (61–68)

61. Optimera bilder (WebP + lazy loading).
62. Implementera code-splitting per route.
63. Lägg till service worker (PWA) för offline.
64. Wrappa med Capacitor → generera iOS + Android-projekt.
65. Konfigurera splash screen + app icon.
66. Testa på riktiga enheter (olika aspect ratios).
67. Lägg till analytics (PostHog / Firebase Analytics).
68. Implementera crash reporting (Sentry).

---

## 8. Monetisering & Live Ops (69–74)

69. Integrera in-app purchases (Capacitor Purchases eller RevenueCat).
70. Bygg soft + hard currency economy.
71. Skapa Battle Pass / Season Pass-struktur.
72. Lägg till limited-time offers.
73. Implementera daily login rewards.
74. Förbered event-system (kan aktiveras via backend).

---

## 9. Testning & Launch Prep (75–82)

75. Skriv unit-tests för core logic (stats, combat, inventory).
76. E2E-tester med Playwright (viktigaste flödena).
77. Balance-pass (damage, rewards, energy).
78. Lokaliseringsstöd (svenska + engelska från start).
79. Privacy Policy + Terms of Service.
80. App Store / Google Play listings (screenshots, beskrivning).
81. Soft launch (TestFlight + Internal Testing).
82. Monitoring dashboard (errors, retention, revenue).

---

## 10. Framtida expansion (efter launch)

83. Riktig multiplayer PvP (WebSocket).
84. Guild Wars / Guild Boss.
85. Auto-battle / Idle-funktioner.
86. Mer avancerad gacha med banners.
87. Social features (vänlista, gifts).
88. Push notifications.
89. Cloud save + cross-device.
90. A/B-testing av economy.

---

### Rekommenderad ordning att bygga

**Fas 1 – Vertical Slice (2–4 veckor)**  
Punkterna 1–38

**Fas 2 – Core Content (3–5 veckor)**  
Punkterna 39–52 + 53–60

**Fas 3 – Polish & Mobil (2–3 veckor)**  
Punkterna 61–74

**Fas 4 – Launch**  
Punkterna 75–82

---

### Tekniska rekommendationer baserat på din skillset

- **Frontend:** React 19 + TypeScript + Vite + Zustand + GSAP + Tailwind
- **Routing:** TanStack Router eller React Router v7
- **State:** Zustand (enkelt och snabbt)
- **Animationer:** GSAP (du kan redan)
- **Mobil:** Capacitor (samma React-kod → native app)
- **Backend:** FastAPI (Python) om du vill snabb utveckling, eller ASP.NET om du vill hålla dig i C#
- **Databas:** PostgreSQL + Prisma / SQLAlchemy / Entity Framework
- **Auth:** Clerk, Supabase Auth eller egen JWT

