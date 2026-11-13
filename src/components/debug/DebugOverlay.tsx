import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHeroStore } from '@/stores/heroStore';
import { HEROES } from '@/data/heroes';
import { useQuestStore } from '@/stores/questStore';
import { SPELL_FX, type SpellFxId } from '@/data/spellFx';
import { SpellFxAuto } from '@/components/fx/SpellFx';
import { useCombatStore } from '@/stores/combatStore';
import {
  battleMapKey,
  mergeLayouts,
  serializeLayouts,
  useBattleLayoutStore,
} from '@/stores/battleLayoutStore';
import { useProgressStore } from '@/stores/progressStore';
import { wipeSave } from '@/services/storage';
import {
  armClipRecorder,
  disarmClipRecorder,
  startClip,
  toggleClip,
  useClipRecorder,
} from '@/services/clipRecorder';

/**
 * Dev-only debug panel. Toggle with Ctrl+Shift+D or by tapping the top-left corner 5 times quickly.
 */
export function DebugOverlay() {
  const visible = useUiStore((s) => s.debugVisible);
  const toggle = useUiStore((s) => s.toggleDebug);
  const [info, setInfo] = useState({ width: 0, height: 0, orientation: '', dpr: 1 });
  const taps = useRef<number[]>([]);
  // Sprite-sheet test: plays one effect in the middle of the screen
  const [fxTest, setFxTest] = useState<{ id: SpellFxId; key: number } | null>(null);
  const battle = useCombatStore((s) => s.battle);
  const battleConfig = useCombatStore((s) => s.config);
  const positionEditing = useBattleLayoutStore((s) => s.editing);
  const setPositionEditing = useBattleLayoutStore((s) => s.setEditing);
  const resetMapLayout = useBattleLayoutStore((s) => s.resetMap);
  const layouts = useBattleLayoutStore((s) => s.layouts);
  const mapKey = battleMapKey(battleConfig);
  const [exportedCode, setExportedCode] = useState<string | null>(null);
  const rec = useClipRecorder();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const update = () =>
      setInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        dpr: window.devicePixelRatio,
      });
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') toggle();
      // F9 starts/stops a clip once capture is armed (works while the panel is hidden).
      if (e.key === 'F9' && useClipRecorder.getState().armed) {
        e.preventDefault();
        toggleClip();
      }
    };
    window.addEventListener('keydown', onKey);
    const onTap = (e: PointerEvent) => {
      if (e.clientX < 60 && e.clientY < 60) {
        const now = Date.now();
        taps.current = [...taps.current.filter((t) => now - t < 1500), now];
        if (taps.current.length >= 5) {
          taps.current = [];
          toggle();
        }
      }
    };
    window.addEventListener('pointerdown', onTap);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onTap);
    };
  }, [toggle]);

  // Hidden while recording so the panel never ends up in a clip.
  if (!import.meta.env.DEV || !visible || rec.recording) return null;

  const give = () => {
    usePlayerStore.getState().addCurrency({
      gold: 100000,
      gems: 5000,
      energy: 100,
      keys: 10,
      arenaCoins: 500,
      guildCoins: 500,
    });
    const inv = useInventoryStore.getState();
    inv.addItem('enhance_stone', 50);
    inv.addItem('xp_potion_l', 20);
    inv.addItem('skill_book', 20);
    inv.addItem('awaken_crystal', 20);
    inv.addItem('dragon_glaive', 1);
  };
  const allHeroes = () => {
    const hs = useHeroStore.getState();
    for (const h of HEROES) {
      hs.addHero(h.id);
      hs.addShards(h.id, 100);
    }
    useQuestStore.getState().track({ type: 'ownHeroes', count: HEROES.length });
  };
  const allMaps = () => useProgressStore.getState().unlockAll();
  const resetAccount = () => {
    if (!window.confirm('Wipe all save data and reload?')) return;
    wipeSave();
    window.location.reload();
  };
  const exportPositions = () => {
    // Shipped positions + local edits, so pasting replaces battleLayouts.ts without losing maps.
    const code = serializeLayouts(mergeLayouts(layouts));
    navigator.clipboard?.writeText(code).catch(() => {});
    console.log(code);
    setExportedCode(code);
  };

  return (
    <div
      className="pointer-events-auto fixed left-2 z-[99999] rounded-md border border-[#0f0] bg-black/90 p-2 font-mono text-[11px] leading-relaxed text-[#0f0]"
      style={{ top: 'calc(var(--header-h) + 8px)' }}
    >
      <div className="font-bold">DEBUG MODE</div>
      <div>
        {info.width} × {info.height} · {info.orientation} · DPR {info.dpr}
      </div>
      <div className="mt-1 flex gap-1">
        <button className="border border-[#0f0] px-1" onClick={give}>
          +resources
        </button>
        <button className="border border-[#0f0] px-1" onClick={allHeroes}>
          +all heroes
        </button>
        <button className="border border-[#0f0] px-1" onClick={allMaps}>
          +all maps
        </button>
        <button className="border border-[#0f0] px-1" onClick={toggle}>
          close
        </button>
        <button className="border border-red-500 px-1 text-red-500" onClick={resetAccount}>
          reset account
        </button>
      </div>
      <div className="mt-1 flex gap-1">
        <button
          className="border border-[#0f0] px-1"
          onClick={() => {
            window.location.hash = '#/debug/combat';
          }}
        >
          combat test
        </button>
        <button className="border border-[#0f0] px-1" onClick={exportPositions}>
          export positions
        </button>
        {Object.keys(layouts).length > 0 && (
          <span className="opacity-60">
            {Object.keys(layouts).length} map{Object.keys(layouts).length === 1 ? '' : 's'} with
            overrides
          </span>
        )}
      </div>
      {exportedCode && (
        <div className="mt-1">
          <div className="opacity-80">
            copied to clipboard – paste into src/data/battleLayouts.ts and commit
          </div>
          <textarea
            readOnly
            value={exportedCode}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 h-24 w-[380px] resize-y border border-[#0f0] bg-black/80 p-1 text-[10px] text-[#0f0]"
          />
          <button className="mt-1 border border-[#0f0] px-1" onClick={() => setExportedCode(null)}>
            dismiss
          </button>
        </div>
      )}
      <div className="mt-1 border-t border-[#0f0]/40 pt-1">
        <div className="opacity-80">clip recorder (for promo trailers)</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {rec.armed ? (
            <>
              {[5, 10, 15].map((s) => (
                <button
                  key={s}
                  className="border border-red-500 px-1 text-red-500"
                  onClick={() => startClip(s)}
                >
                  ● rec {s}s
                </button>
              ))}
              <button className="border border-[#0f0] px-1" onClick={disarmClipRecorder}>
                stop capture
              </button>
            </>
          ) : (
            <button className="border border-[#0f0] px-1" onClick={() => void armClipRecorder()}>
              arm capture (pick this tab)
            </button>
          )}
        </div>
        <div className="opacity-60">
          F9 = start/stop manually · panel hides while recording
          {rec.lastSaved && <div className="opacity-100">saved: {rec.lastSaved}</div>}
          {rec.error && <div className="text-red-500">{rec.error}</div>}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {(Object.keys(SPELL_FX) as SpellFxId[]).map((id) => (
          <button
            key={id}
            className="border border-[#0f0] px-1"
            onClick={() => setFxTest({ id, key: Date.now() })}
          >
            fx:{id}
          </button>
        ))}
      </div>
      {fxTest && (
        <div className="pointer-events-none fixed inset-0 z-[99998]">
          <SpellFxAuto
            key={fxTest.key}
            sheet={SPELL_FX[fxTest.id]}
            scale={1.5}
            onDone={() => setFxTest(null)}
          />
        </div>
      )}
      {battle && (
        <div className="mt-1 border-t border-[#0f0]/40 pt-1">
          <div className="opacity-80">positions: {mapKey}</div>
          <div className="mt-1 flex gap-1">
            <button
              className={`border border-[#0f0] px-1 ${positionEditing ? 'bg-[#0f0] text-black' : ''}`}
              onClick={() => setPositionEditing(!positionEditing)}
            >
              {positionEditing ? 'editing: on' : 'edit positions'}
            </button>
            <button className="border border-[#0f0] px-1" onClick={() => resetMapLayout(mapKey)}>
              reset map
            </button>
          </div>
        </div>
      )}
      <div className="mt-1 opacity-60">Ctrl+Shift+D / 5 taps top-left</div>
    </div>
  );
}
