# Fantasy Quest – Development & Mobile Debug Setup

Mål: Kunna utveckla och testa spelet **i landscape** direkt i webbläsaren med mobil-känsla, utan att behöva bygga native varje gång.

---

## 1. Grundläggande Vite-setup (rekommenderas)

### `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,          // Viktigt! Gör att du kan öppna från telefonen på samma nät
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
```

Starta:

```bash
npm run dev
```

---

## 2. Tvinga Landscape + Mobil-viewport

### `index.html`

```html
<!DOCTYPE html>
<html lang="sv">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#0f0c1a" />
    <title>Fantasy Quest</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Global CSS (`src/styles/globals.css`)

```css
html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0f0c1a;
  /* Förhindra rubber-banding på iOS */
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* Tvinga landscape-känsla i utvecklingsläge */
body {
  touch-action: manipulation;
}

/* Safe area support (notch etc.) */
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}
```

---

## 3. Bästa sättet att testa i webbläsaren (Debug-läge)

### A. Chrome / Edge DevTools (rekommenderas starkt)

1. Öppna `http://localhost:5173`
2. Tryck **F12** → **Toggle device toolbar** (`Ctrl+Shift+M` / `Cmd+Shift+M`)
3. Välj en modern telefon (t.ex. **iPhone 14 Pro**, **Pixel 7**, **Samsung Galaxy S23**)
4. Klicka på **Rotate** så den blir **landscape**
5. Aktivera:
   - **Show media queries**
   - **Show rulers** (valfritt)
   - **Touch** simulation (standard i device mode)

**Tips:** Spara egna presets:
- `iPhone 14 Pro Landscape` (390 × 844 → rotera)
- `Android Landscape 16:9` (800 × 360 eller 915 × 412)

### B. Riktig telefon på samma Wi-Fi

1. Starta Vite med `host: true`
2. Hitta din datorns lokala IP (`ipconfig` / `ifconfig`)
3. Öppna `http://DIN-IP:5173` i telefonens webbläsare
4. Lägg till på hemskärmen (PWA) för mer native-känsla

---

## 4. Debug Overlay (rekommenderas för utveckling)

Skapa en liten debug-panel som bara syns i development.

### `src/components/debug/DebugOverlay.tsx`

```tsx
import { useEffect, useState } from 'react';

export function DebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState({
    width: 0,
    height: 0,
    orientation: '',
    dpr: 1,
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const update = () => {
      setInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        dpr: window.devicePixelRatio,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    // Visa/dölj med tangentbord: Ctrl + Shift + D
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!import.meta.env.DEV || !visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 12,
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #0f0',
        pointerEvents: 'none',
        lineHeight: 1.5,
      }}
    >
      <div>DEBUG MODE</div>
      <div>{info.width} × {info.height}</div>
      <div>{info.orientation}</div>
      <div>DPR: {info.dpr}</div>
      <div style={{ marginTop: 4, opacity: 0.7 }}>Ctrl+Shift+D to toggle</div>
    </div>
  );
}
```

Lägg in den högst upp i din app:

```tsx
// App.tsx
import { DebugOverlay } from '@/components/debug/DebugOverlay';

function App() {
  return (
    <>
      <DebugOverlay />
      {/* resten av spelet */}
    </>
  );
}
```

---

## 5. Landscape Guard (varnar om någon kör portrait)

```tsx
// src/components/LandscapeGuard.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function LandscapeGuard({ children }: { children: React.ReactNode }) {
  const [isLandscape, setIsLandscape] = useState(true);
  const { t } = useTranslation('common');

  useEffect(() => {
    const check = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!isLandscape) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0f0c1a',
        color: '#d4af37',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        zIndex: 100000,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📱↔️</div>
        <h2>Rotera enheten</h2>
        <p>Fantasy Quest spelas i landscape-läge</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 6. Extra användbara debug-verktyg

| Verktyg | Syfte | Hur |
|---------|------|-----|
| Chrome Device Mode | Emulera telefon + landscape | F12 → Ctrl+Shift+M |
| Responsive Viewer (Chrome extension) | Flera enheter samtidigt | Installera extension |
| Vite + `--host` | Testa från riktig telefon | Redan i config ovan |
| React DevTools | Inspektera state/komponenter | Browser extension |
| Zustand DevTools | Se store-ändringar | `devtools` middleware |
| GSAP DevTools | Inspektera animationer | Valfritt |

### Zustand med DevTools (rekommenderas)

```ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const usePlayerStore = create(
  devtools(
    (set) => ({
      // ...
    }),
    { name: 'PlayerStore' }
  )
);
```

---

## 7. Snabb checklista – Development Debug Mode

- [ ] Vite körs med `host: true`
- [ ] Viewport meta-tag är korrekt (ingen zoom)
- [ ] Chrome Device Toolbar i **landscape**
- [ ] DebugOverlay syns med `Ctrl+Shift+D`
- [ ] LandscapeGuard visar varning i portrait
- [ ] Safe-area CSS-variabler används i layout
- [ ] Touch-events fungerar (inga hover-only interaktioner)
- [ ] Du kan öppna spelet från telefonen på samma nät

---

## 8. När du går över till Capacitor senare

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
```

Under utveckling kan du använda **live reload**:

```bash
npx cap run android -l --external
# eller
npx cap run ios -l --external
```

Då får du samma snabba feedback-loop som i webbläsaren, men på riktig enhet.
