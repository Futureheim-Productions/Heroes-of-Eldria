# GSAP Spell Animation – 9-slice spritesheet

**Mål:** Ta en 3×3-bild (9 frames), spela den **vänster → höger, upp → ner**, och trigga den när en spell castas.

**Bild:** `void_explosion.png`  
**Ordning:**

```
1  2  3
4  5  6
7  8  9
```

Frame 1 = liten void-orb  
Frame 9 = rök som dör ut

**Stack:** React + TypeScript + GSAP (ingen canvas-motor krävs)

---

## 1. Princip

Använd **CSS spritesheet** + GSAP som animerar `background-position`.

- Bilden är en grid: 3 kolumner × 3 rader
- Varje frame har samma storlek: `sheetWidth / 3` × `sheetHeight / 3`
- GSAP stegar frameIndex från `0` till `8`
- `background-position` räknas ut från frameIndex

Ingen `<video>`, ingen Lottie, ingen canvas. En `div` räcker.

---

## 2. Filstruktur

```
src/
├── assets/fx/
│   └── void_explosion.png
├── components/fx/
│   ├── SpellFx.tsx
│   └── SpellFx.css
├── hooks/
│   └── useSpellSprite.ts
└── utils/
    └── spriteSheet.ts
```

---

## 3. Konfiguration

```ts
// src/utils/spriteSheet.ts
export type SpriteSheetConfig = {
  src: string;
  columns: number;
  rows: number;
  frameWidth: number;   // px i bildfilen
  frameHeight: number;  // px i bildfilen
  duration: number;     // total tid i sekunder
};

export const VOID_EXPLOSION: SpriteSheetConfig = {
  src: '/assets/fx/void_explosion.png',
  columns: 3,
  rows: 3,
  frameWidth: 512,      // mät din bild / 3
  frameHeight: 512,     // mät din bild / 3
  duration: 0.7,
};

export function frameToPosition(
  index: number,
  config: SpriteSheetConfig
): { x: number; y: number } {
  const col = index % config.columns;
  const row = Math.floor(index / config.columns);
  return {
    x: -(col * config.frameWidth),
    y: -(row * config.frameHeight),
  };
}
```

**Viktigt:** Mät den faktiska bildstorleken. Om `void_explosion.png` är t.ex. 1536×1536 blir varje frame 512×512.

Kolla med:

```bash
file void_explosion.png
# eller i webbläsaren: img.naturalWidth / 3
```

---

## 4. Hook – GSAP sprite player

```ts
// src/hooks/useSpellSprite.ts
import { useRef, useCallback } from 'react';
import gsap from 'gsap';
import { frameToPosition, type SpriteSheetConfig } from '@/utils/spriteSheet';

export function useSpellSprite(config: SpriteSheetConfig) {
  const elRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const play = useCallback((onComplete?: () => void) => {
    const el = elRef.current;
    if (!el) return;

    tweenRef.current?.kill();

    const totalFrames = config.columns * config.rows;
    const state = { frame: 0 };

    // hoppa till frame 0 direkt
    const start = frameToPosition(0, config);
    gsap.set(el, {
      backgroundPosition: `${start.x}px ${start.y}px`,
      autoAlpha: 1,
    });

    tweenRef.current = gsap.to(state, {
      frame: totalFrames - 1,
      duration: config.duration,
      ease: 'none',          // linjär = jämn frame-step
      snap: { frame: 1 },    // hela frames, ingen morph
      onUpdate: () => {
        const { x, y } = frameToPosition(state.frame, config);
        gsap.set(el, { backgroundPosition: `${x}px ${y}px` });
      },
      onComplete: () => {
        gsap.set(el, { autoAlpha: 0 });
        onComplete?.();
      },
    });
  }, [config]);

  const stop = useCallback(() => {
    tweenRef.current?.kill();
    if (elRef.current) gsap.set(elRef.current, { autoAlpha: 0 });
  }, []);

  return { elRef, play, stop };
}
```

Varför `snap: { frame: 1 }`?  
Annars interpolerar GSAP mellan 3.2 och 3.7 och du får “halva frames”.

---

## 5. Komponent

```tsx
// src/components/fx/SpellFx.tsx
import { VOID_EXPLOSION } from '@/utils/spriteSheet';
import { useSpellSprite } from '@/hooks/useSpellSprite';
import { forwardRef, useImperativeHandle } from 'react';

export type SpellFxHandle = {
  play: (onComplete?: () => void) => void;
  stop: () => void;
};

type Props = {
  x?: number;       // position i combat-scenen (px)
  y?: number;
  scale?: number;   // 1 = original frame-size
  className?: string;
};

export const SpellFx = forwardRef<SpellFxHandle, Props>(
  function SpellFx({ x = 0, y = 0, scale = 1, className }, ref) {
    const { elRef, play, stop } = useSpellSprite(VOID_EXPLOSION);

    useImperativeHandle(ref, () => ({ play, stop }), [play, stop]);

    return (
      <div
        ref={elRef}
        className={`spell-fx ${className ?? ''}`}
        style={{
          left: x,
          top: y,
          width: VOID_EXPLOSION.frameWidth * scale,
          height: VOID_EXPLOSION.frameHeight * scale,
          backgroundImage: `url(${VOID_EXPLOSION.src})`,
          backgroundSize: `${VOID_EXPLOSION.columns * 100}% ${VOID_EXPLOSION.rows * 100}%`,
        }}
      />
    );
  }
);
```

```css
/* src/components/fx/SpellFx.css */
.spell-fx {
  position: absolute;
  pointer-events: none;
  opacity: 0;
  background-repeat: no-repeat;
  image-rendering: auto; /* byt till pixelated om du vill ha skarpare pixels */
  z-index: 50;
  transform: translate(-50%, -50%); /* centrera på x/y */
}
```

`background-size: 300% 300%` är nyckeln. Då är varje frame exakt 100% av elementets yta.

---

## 6. Koppla till spell-cast

```tsx
// i combat-skärmen
const fxRef = useRef<SpellFxHandle>(null);

function castSpell(target: { x: number; y: number }) {
  // 1. visa FX på målet
  setFxPos(target);

  // 2. spela animationen
  requestAnimationFrame(() => {
    fxRef.current?.play(() => {
      applyDamage(target); // när explosionen är klar
    });
  });
}

return (
  <div className="combat-stage">
    {/* hjältar / fiender */}
    <SpellFx ref={fxRef} x={fxPos.x} y={fxPos.y} scale={0.6} />
  </div>
);
```

### Rekommenderad timing

| Steg | Tid |
|------|-----|
| Cast-start (karaktär animation) | 0.00s |
| FX start (frame 1) | 0.15s |
| Peak (frame 4–6) | ~0.35s |
| Fade (frame 7–9) | ~0.55–0.70s |
| Damage / hit-spark | vid frame 4 eller onComplete |

Void-explosionen passar **skugg / void / dark magic**.  
Lyra (frost) bör ha ett annat sheet senare.

---

## 7. Flera FX samtidigt

En instans = en explosion. För multi-target (kedjeblixt etc.):

```tsx
const [bursts, setBursts] = useState<{ id: string; x: number; y: number }[]>([]);

function spawnBurst(x: number, y: number) {
  const id = crypto.randomUUID();
  setBursts(prev => [...prev, { id, x, y }]);
}

function removeBurst(id: string) {
  setBursts(prev => prev.filter(b => b.id !== id));
}

{bursts.map(b => (
  <SpellFxAuto
    key={b.id}
    x={b.x}
    y={b.y}
    onDone={() => removeBurst(b.id)}
  />
))}
```

`SpellFxAuto` = samma komponent som anropar `play()` i `useEffect`.

---

## 8. Checklista – implementation

1. Mät `void_explosion.png` (`naturalWidth`, `naturalHeight`).
2. Sätt `frameWidth = width / 3`, `frameHeight = height / 3`.
3. Lägg bilden i `public/assets/fx/` eller importera via Vite.
4. Bygg `spriteSheet.ts` + `useSpellSprite.ts` + `SpellFx.tsx`.
5. Testa i webbläsaren: knapp “Play FX” som anropar `play()`.
6. Justera `duration` (0.5–0.9s känns oftast bäst för combat).
7. Koppla till en riktig spell i combat-loopen.
8. Lägg till scale per spell (liten orb = 0.4, ultimate = 1.0).
9. (Valfritt) GSAP `overwrite: true` om samma FX spelas om snabbt.
10. (Valfritt) Ljud: `onUpdate` när frame === 3 → play SFX.

---

## 9. Vanliga fel

| Problem | Orsak | Fix |
|---------|--------|-----|
| Visar hela 3×3-bilden | `background-size` saknas | `300% 300%` |
| Fel frame / hoppar | fel `frameWidth` | mät bilden, dela med 3 |
| Suddig animation | GSAP interpolerar floats | `snap: { frame: 1 }` + `ease: 'none'` |
| Syns bakom karaktärer | låg z-index | `z-index: 50+` |
| Ligger snett på målet | ingen centrering | `transform: translate(-50%, -50%)` |
| Första frame blinkar | opacity 1 för tidigt | starta `autoAlpha: 0`, sätt 1 i `play()` |
| Vite hittar inte bilden | fel path | importera: `import sheet from '@/assets/fx/void_explosion.png'` |

---

## 10. Utöka senare

- Flera sheets: `frost_burst`, `holy_smash`, `knife_flash`
- Atlas-map: `{ spellId: SpriteSheetConfig }`
- Preload alla sheets vid combat-start
- Screen shake på frame 4–5 (`gsap.to(stage, { x: 4, yoyo: true, repeat: 3, duration: 0.05 })`)
- Tint via `filter: hue-rotate()` om du återanvänder samma sheet i annan färg

---

## 11. Mini-test (gör detta först)

En sida med bara:

- svart bakgrund
- `SpellFx` i mitten
- knapp “Cast”

När 1 → 9 spelas i rätt ordning utan flicker är core klar. Först därefter in i combat.
