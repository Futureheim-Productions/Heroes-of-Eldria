# Heroes of Eldria — Still-Actor Animation (GSAP)

Plan för att få **en stillbild per hjälte/monster** att kännas levande i landscape-combat.  
Inga spritesheets. Inga walk-cycles. Motion sker på wrapper-lager.

Stack: React + TSX + GSAP  
Layout: hjältar vänster, monster höger.

Max scope: idle, turn-highlight, attack step-in, hit flash, death, camera, damage numbers, koppling till 9-slice SpellFx.

---

## 0. Mål

1. En karaktär = en PNG + 4 overlay-lager.
2. Fem states: `idle | focus | attack | hit | death`.
3. Attack-timeline synkar med befintlig 9-slice SpellFx.
4. Fungerar i web-debug (landscape) och Capacitor.
5. Ingen ny karaktärsart krävs för v1.

---

## 1. Filstruktur

```
src/
  combat/
    actors/
      StillActor.tsx
      ActorShadow.tsx
      ActorGlow.tsx
      ActorHitOverlay.tsx
      useActorMotion.ts
    fx/
      SpellFx.tsx              # redan planerad 9-slice
      DamageFloater.tsx
      Projectile.tsx
    camera/
      CombatStage.tsx
      useCombatCamera.ts
    timeline/
      CombatAnimator.ts
      attackTimings.ts
    types.ts
    demo/
      CombatAnimSandbox.tsx
```

---

## 2. DOM-lager per actor

```
.actor-root                 // position, x/y/scale/rotate
  .actor-glow               // klassfärg, bakom
  .actor-img                // stillbild, pointer-events none
  .actor-shadow             // ellipse under fötter
  .actor-hit-overlay        // vit/röd flash
```

CSS-krav:

6. `actor-root` är `position: absolute` på en golvlinje.
7. Bilden är `object-fit: contain`, fötter mot nederkant.
8. Glow och overlay täcker samma box som bilden.
9. Shadow sitter `bottom: -8px`, `scaleX` andas med idle.
10. `will-change: transform` bara under attack (ta bort efter).

---

## 3. Types

```ts
export type ActorSide = 'hero' | 'enemy';
export type ActorClass = 'warrior' | 'mage' | 'assassin' | 'archer' | 'tank' | 'necro';
export type ActorState = 'idle' | 'focus' | 'attack' | 'hit' | 'death';

export interface ActorView {
  id: string;
  name: string;
  artSrc: string;
  side: ActorSide;
  classId: ActorClass;
  glowColor: string;
}
```

11. `glowColor` per hjälte (Kael orange, Nera teal, Elarion gold, Grimvald green, Freja ice-blue, Solveig cyan).
12. `side` styr attack-riktning: hero `x+`, enemy `x-`.

---

## 4. StillActor.tsx

13. Props: `actor`, `state`, `slotIndex`, `onReady(ref)`.
14. Exponera root-ref till `CombatAnimator`.
15. Kör inte animation i render. State-byte triggar hook.
16. `death` sätter `pointer-events: none` och lämnar placeholder-slot tom.
17. Lazy-load bild. Visa 1x1 placeholder tills `onLoad`.

---

## 5. useActorMotion.ts — de 5 states

Alla tweens på **samma root**. Döda föregående tween med `gsap.killTweensOf(root)` innan ny state.

### idle
18. `y: -5`, `duration: 1.3 + slotIndex * 0.11`, `yoyo`, `repeat: -1`, `ease: sine.inOut`.
19. Shadow: `scaleX: 0.9`, samma duration.
20. Aldrig samma delay på alla tre hjältar.

### focus (det är din tur)
21. Stoppa inte idle helt — sänk idle-amp till `y: -3`.
22. `scale: 1.06`, `filter: brightness(1.15)`.
23. Glow `autoAlpha: 0.65`.
24. Övriga actors: `opacity: 0.65` (sätts från animator, inte från actor själv).

### attack
25. Hero: `x: 24–32`, `scale: 1.08`, `rotate: 1.5`.
26. Enemy: `x: -24–32`, `rotate: -1.5`.
27. Duration in: `0.12`, ease `power2.out`.
28. Hold 1 frame, sen SpellFx + projectile.
29. Return: `0.20`, ease `back.out(2)`.

### hit
30. Overlay `autoAlpha 0.85 → 0` på 0.12s.
31. Knockback 10–16 px bort från mittlinjen, yoyo 1.
32. Kort `brightness(2.2)` på img.
33. Inte rotera mer än 4 grader — stillbild klipps fult annars.

### death
34. `y: 22`, `rotate: 7`, `grayscale(1)`, `brightness(0.55)`, `autoAlpha: 0`, `0.45s`.
35. Shadow fade först.
36. Efter complete: `aria-hidden`, ta bort från tab-order.

---

## 6. Klass-varianter (samma PNG)

37. Warrior: större x (32), shake 6px.
38. Tank: x 12 på sig själv, knockback 20 på target.
39. Mage: x 8 (står kvar), glow 1.0, projectile obligatorisk.
40. Assassin: `autoAlpha: 0` i 70ms, teleport-x till target, slash, tillbaka.
41. Archer: `scaleX: 0.96` 80ms (spänner), sen projectile.
42. Necro: ingen dash, grön glow-pulse under target.

Mappa `classId → motionPreset` i `attackTimings.ts`.

---

## 7. CombatStage + kamera

43. En wrapper `#combat-stage` runt båda sidor + FX-lager.
44. `useCombatCamera`:
    - light: `x: 4`, 2 repeats
    - medium: `x: 7, y: 3`, 4 repeats
    - ult: `scale: 1.03` + medium shake
45. Shake på stage, aldrig på enskild actor samtidigt som attack-x (dubbel motion ser drunk).
46. Reset `x/y/scale` till 0 efter varje shake (`overwrite: true`).

---

## 8. DamageFloater

47. Portal till stage, positionerad vid target-bröst (60 % upp på actor-box).
48. Text: normal vit, crit guld + ordet `CRITICAL`.
49. Motion: `y: -48`, `scale 0.4 → 1.25 → 1`, fade efter 0.5s.
50. Stacka flera hits med `x`-offset 12 px.

---

## 9. Projectile.tsx

51. En div eller 1 liten PNG.
52. Start: actor center. End: target center.
53. `gsap.to({ x, y, duration: 0.18, ease: power2.in })`.
54. Mage/archer/necro använder den. Warrior/tank skippar (melee step-in räcker).
55. Dölj projectile på complete, återanvänd node (pool på 3).

---

## 10. CombatAnimator.ts — attack pipeline

```
0.00  setFocus(actor) + dim others
0.08  attack wind-up
0.20  projectile start (om preset)
0.26  SpellFx.play() i impact-punkt
0.28  camera shake
0.28  target hit-state
0.30  DamageFloater
0.50  actor return to idle
0.55  undim others
```

56. Animator äger timeline. Actors är dumma views.
57. `playAttack({ actorId, targetId, skillId, damage, isCrit, fxId })`.
58. Returnera `Promise` så combat-reducer väntar.
59. Avbryt med `tl.kill()` vid skip/fast-forward (AUTO x2).
60. x2 speed = `tl.timeScale(2)`.

---

## 11. Koppling till 9-slice SpellFx

61. SpellFx är ett lager i mitten av stage, inte child till actor.
62. Impact-punkt = target bounding box center.
63. Starta sheet på frame 0 när projectile landar, inte när wind-up börjar.
64. Olika sheets senare: void, ice, slash, heal. Samma API.
65. Z-index: shadow < glow < img < projectile < spellfx < floater < overlay-ui.

---

## 12. Slot-layout (landscape)

66. Tre hero-slots: vänster, vertikalt stacked eller lätt diagonal bakåt.
67. En eller fler enemy-slots höger.
68. Gemensam golvlinje `bottom: 18%` av stage.
69. Scale: front hero `1.0`, bakre `0.92` (falskt djup).
70. Safe area: lämna 140 px nederkant till skill-bar.

---

## 13. Demo / debug

71. `CombatAnimSandbox` route: `/debug/combat-anim`.
72. Knappar: Idle, Focus, Attack melee, Attack mage, Hit, Crit, Death, x2.
73. Visa current GSAP tweens i en liten overlay i DEV.
74. Fungerar i Chrome device toolbar landscape.
75. Ingen Capacitor krävs för att testa motion.

---

## 14. Performance

76. Max ~6 actors + 1 fx + 3 floaters.
77. Inga `filter` på idle (dyrt). Filter bara 80–150 ms vid hit.
78. `gsap.set(willChange, 'transform')` före attack, clear efter.
79. En ticker. Inte en `setInterval` per actor.
80. Bilder preloadas i hero-select / dungeon-enter.

---

## 15. Acceptance

81. Tre stilla hjältar andas ur fas.
82. Attack syns även om SpellFx är av.
83. Crit = större siffra + tyngre shake.
84. Death tar bort glow och lämnar slot.
85. AUTO x2 ser inte ut som att de teleportar fel.
86. Ingen layout-shift när siffror poppar.

---

## 16. Inte i v1

- Extra attack-pose PNG
- Spine / DragonBones
- Per-skill unique body motion
- 3D tilt
- After-image trails på alla klasser (bara assassin om tid)

---

## 17. Implementationsordning (rekommenderad)

1. StillActor + shadow + idle  
2. CombatStage + slots  
3. focus + dim others  
4. attack step-in / return  
5. hit overlay + knockback  
6. camera shake  
7. DamageFloater  
8. koppla SpellFx  
9. Projectile + klass-presets  
10. death  
11. sandbox + timeScale  
12. polish glow-färger  

Klar när steg 1–8 är inne. 9–12 är sauce.
