import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import type { BattleEvent, Combatant, SkillDef } from '@/types';
import { useCombatStore } from '@/stores/combatStore';
import { arenaOpponents, completeArena, completeDungeon } from '@/services/game';
import { canUseSkill, validTargets } from '@/utils/battle';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PartyPortrait, STATUS_GLYPH, UnitHud } from './BattleUnit';
import { getStage } from '@/data/dungeons';
import { stageArt } from '@/data/stageArt';
import { formatNumber } from '@/utils/format';
import { ResultModal } from './ResultModal';
import { haptic } from '@/services/haptics';
import { SPELL_FX, skillFx, skillFxAll } from '@/data/spellFx';
import { heroForm } from '@/data/heroForms';
import { HERO_MAP } from '@/data/heroes';
import { ELEMENT_COLORS } from '@/utils/constants';
import { preloadSheets } from '@/utils/spriteSheet';
import { battleMapKey, useBattleLayoutStore } from '@/stores/battleLayoutStore';
import { CombatStage } from '@/combat/camera/CombatStage';
import { formationSlots, pickSummonSpot, type SlotPos } from '@/combat/camera/slots';
import { useCombatAnimator } from '@/combat/timeline/useCombatAnimator';
import type { FloatTextOpts, HitSpec } from '@/combat/timeline/CombatAnimator';
import { heroView, monsterView } from '@/combat/actorViews';
import type { ActorView } from '@/combat/types';

/** A text to float over a unit once the blow lands (or right away when nothing is cast). */
interface PendingText {
  targetId: string;
  text: string | number;
  opts: FloatTextOpts;
}

/**
 * Still-actor view of a combatant; heroes fighting on the enemy side (arena) are mirrored.
 * `inForm`: the unit has transformed (see data/heroForms.ts) – show the form's sprite.
 */
function toView(c: Combatant, spot?: SlotPos, inForm = false): ActorView | undefined {
  const base =
    c.defId in HERO_MAP
      ? heroView(c.defId, { side: c.side, skin: c.skin, name: c.name, uid: c.uid })
      : monsterView(c.defId, {
          uid: c.uid,
          name: c.name,
          big: c.isBoss,
          glowColor: ELEMENT_COLORS[c.element],
        });
  const form = inForm ? heroForm(c.defId) : undefined;
  if (!base) return undefined;
  return form
    ? {
        ...base,
        summoned: c.summoned,
        spot,
        artSrc: form.art,
        aspect: form.aspect,
        sizeScale: form.scale,
      }
    : { ...base, summoned: c.summoned, spot };
}

export default function CombatScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation(['combat', 'heroes', 'common', 'world-map', 'pvp']);
  const battle = useCombatStore((s) => s.battle);
  const config = useCombatStore((s) => s.config);
  const auto = useCombatStore((s) => s.auto);
  const speed = useCombatStore((s) => s.speed);
  const summary = useCombatStore((s) => s.summary);
  const selectedSkillId = useCombatStore((s) => s.selectedSkillId);
  const { step, act, setAuto, setSpeed, setSelectedSkill, setSummary, clear } =
    useCombatStore.getState();
  const positionEditing = useBattleLayoutStore((s) => s.editing);
  // Subscribed so edits (or a "reset map") re-render immediately; getOffset itself
  // falls back to the shipped defaults in data/battleLayouts.ts when unset locally.
  useBattleLayoutStore((s) => s.layouts);
  const getPositionOffset = useBattleLayoutStore((s) => s.getOffset);
  const setPositionOffset = useBattleLayoutStore((s) => s.setOffset);
  const mapKey = battleMapKey(config);

  const animator = useCombatAnimator(speed);
  const [lastSkill, setLastSkill] = useState<{
    actorId: string;
    skillId: string;
    key: number;
  } | null>(null);
  const busy = useRef(false);
  const timer = useRef<number | null>(null);
  const runId = useRef(0);
  const finished = useRef(false);
  const doneTimer = useRef<number | null>(null);
  const battleIdRef = useRef<string | null>(null);
  /**
   * Units currently shown in their transformed form. Driven by the animation (the sprite
   * swaps on the transformation's last frame), not straight from the engine's statuses.
   */
  const [forms, setForms] = useState<Record<string, boolean>>({});
  const formsRef = useRef(forms);
  const setForm = useCallback((uid: string, on: boolean) => {
    formsRef.current = { ...formsRef.current, [uid]: on };
    setForms(formsRef.current);
  }, []);
  /** Where each summon landed – picked once, when it first appears. */
  const summonSpots = useRef(new Map<string, SlotPos>());

  const delay = useCallback((ms: number) => ms / speed, [speed]);

  // Warm the cache for every effect this battle can play so the first cast does not pop in late.
  useEffect(() => {
    if (!battle) return;
    preloadSheets(battle.combatants.flatMap((c) => c.skills).flatMap(skillFxAll));
    // Summon uids repeat between battles (`e_<id>_s0_<turn>`), so spots are per battle.
    summonSpots.current.clear();
    animator.resetBattle();
    formsRef.current = {};
    setForms({});
    // Transformation sprites swap in mid-animation – have them cached by then.
    for (const c of battle.combatants) {
      const form = heroForm(c.defId);
      if (form) new Image().src = form.art;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle?.id]);

  /**
   * Turns engine events into still-actor animation: the cast skill becomes one attack
   * timeline (step-in, SpellFx, shake, hit, numbers, deaths); everything else floats as text.
   * Resolves when the animation is done so the turn loop can wait for it.
   */
  const playEvents = useCallback(
    async (events: BattleEvent[]) => {
      const texts: PendingText[] = [];
      const direct: BattleEvent[] = [];
      const ticks: string[] = [];
      const push = (targetId: string, text: string | number, opts: FloatTextOpts = {}) =>
        texts.push({ targetId, text, opts });
      for (const e of events) {
        if (!e.targetId) continue;
        switch (e.type) {
          case 'damage':
            if (e.text === 'reflect') push(e.targetId, `↩ ${e.value}`, { color: '#ffb8b0' });
            else if (e.text === 'link') push(e.targetId, `🔗 ${e.value}`, { color: '#e0a8ff' });
            else if (e.text === 'sacrifice') push(e.targetId, `-${e.value}`, { color: '#ff6b5b' });
            else if (e.status) {
              const glyph = e.status === 'burn' ? '🔥' : e.status === 'bleed' ? '🩸' : '☠️';
              push(e.targetId, `${glyph} ${e.value}`, { color: '#c4ff9a' });
              ticks.push(e.targetId);
            } else direct.push(e);
            break;
          case 'heal':
            push(e.targetId, e.value ?? 0, { heal: true });
            break;
          case 'shield':
            if ((e.value ?? 0) > 0) push(e.targetId, `🛡 ${e.value}`, { color: '#8fd8ff' });
            break;
          case 'miss':
            push(e.targetId, t(`combat:${e.text ?? 'dodge'}`), { color: '#a99f92', small: true });
            break;
          case 'status':
            if (e.status && e.text !== 'expired' && e.status !== 'shield')
              push(
                e.targetId,
                (e.text === 'cleansed' ? '✨ ' : '') + t(`combat:status.${e.status}`),
                { color: e.text === 'cleansed' ? '#ffe9a8' : '#b388ff', small: true },
              );
            break;
          case 'revive':
            push(e.targetId, t('combat:revived'), { color: '#ffe9a8' });
            break;
          case 'death':
            haptic('heavy');
            break;
        }
      }
      const flush = () => {
        for (const x of texts) animator.floatText(x.targetId, x.text, x.opts);
        texts.length = 0;
      };

      const skillEv = events.find((e) => e.type === 'skill');
      const combatants = useCombatStore.getState().battle?.combatants ?? [];
      const caster = skillEv?.actorId
        ? combatants.find((c) => c.uid === skillEv.actorId)
        : undefined;
      const def = caster?.skills.find((s) => s.id === skillEv?.skillId);

      if (caster && def) {
        setLastSkill({ actorId: caster.uid, skillId: def.id, key: Date.now() });
        // Transformation skill (Kael's Draken): play the change first, then the attack as the new form.
        const form = heroForm(caster.defId);
        const transforms =
          form &&
          !formsRef.current[caster.uid] &&
          def.effects.some(
            (e) => e.kind === 'status' && e.status === form.status && e.target === 'self',
          );
        if (form && transforms)
          await animator.playTransform(caster.uid, SPELL_FX[form.transformFx], () =>
            setForm(caster.uid, true),
          );
        if (direct.length) {
          const deaths = new Set(events.filter((e) => e.type === 'death').map((e) => e.targetId));
          const [first, ...rest] = direct;
          const seen = new Set([first.targetId]);
          const extraHits: HitSpec[] = [];
          for (const r of rest) {
            if (seen.has(r.targetId)) {
              // Multi-hit on the same target: the extra numbers stack on the impact.
              push(r.targetId!, r.value ?? 0, { crit: r.crit });
              continue;
            }
            seen.add(r.targetId);
            extraHits.push({
              targetId: r.targetId!,
              damage: r.value,
              isCrit: r.crit,
              lethal: deaths.has(r.targetId),
            });
          }
          haptic('light');
          await animator.playAttack({
            actorId: caster.uid,
            targetId: first.targetId!,
            skillId: def.id,
            damage: first.value,
            isCrit: first.crit,
            lethal: deaths.has(first.targetId),
            sheet: skillFx(def),
            ult: def.kind === 'ultimate',
            extraHits,
            onImpact: flush,
          });
        } else {
          // Heals, buffs, summons, all-miss: cast in place.
          const cast = animator.playCast(caster.uid);
          flush();
          await cast;
        }
      } else {
        for (const id of ticks) animator.playHit(id);
      }
      flush();

      // Deaths from ticks / reflects, and revives: bring the stage in line with the engine.
      const now = useCombatStore.getState().battle?.combatants ?? [];
      const pending: Promise<void>[] = [];
      for (const c of now) {
        if (!c.alive && !animator.isDead(c.uid)) pending.push(animator.playDeath(c.uid));
        else if (c.alive && animator.isDead(c.uid)) animator.revive(c.uid);
        // Forms end with their status (expired, cleansed, death).
        const form = heroForm(c.defId);
        if (!form) continue;
        const inForm = c.alive && c.statuses.some((st) => st.id === form.status);
        if (formsRef.current[c.uid] && !inForm)
          animator.playRevert(c.uid, () => setForm(c.uid, false));
        else if (!formsRef.current[c.uid] && inForm) setForm(c.uid, true);
      }
      await Promise.all(pending);
    },
    [animator, setForm, t],
  );

  /** Core driver: after every state change decide what to do next. */
  const drive = useCallback(() => {
    const st = useCombatStore.getState();
    const b = st.battle;
    if (!b || busy.current) return;
    if (b.result !== 'ongoing') {
      if (finished.current) return;
      finished.current = true;
      doneTimer.current = window.setTimeout(() => {
        const cfg = st.config!;
        const s =
          cfg.mode === 'dungeon'
            ? completeDungeon(b, cfg)
            : completeArena(
                b,
                arenaOpponents().find((o) => o.id === cfg.opponentId),
              );
        setSummary(s);
      }, delay(700));
      return;
    }
    if (!b.activeId) {
      busy.current = true;
      const events = step();
      const run = runId.current;
      void playEvents(events).then(() => {
        if (run !== runId.current) return;
        busy.current = false;
        timer.current = window.setTimeout(
          drive,
          events.some((e) => e.type === 'damage' || e.type === 'info') ? delay(250) : 30,
        );
      });
      return;
    }
    const actor = b.combatants.find((c) => c.uid === b.activeId)!;
    if (actor.side === 'enemy' || st.auto) {
      busy.current = true;
      timer.current = window.setTimeout(
        () => {
          const events = useCombatStore.getState().aiAct();
          const run = runId.current;
          void playEvents(events).then(() => {
            if (run !== runId.current) return;
            busy.current = false;
            timer.current = window.setTimeout(drive, delay(250));
          });
        },
        delay(actor.side === 'enemy' ? 550 : 350),
      );
    }
  }, [delay, setSummary, playEvents, step]);

  useEffect(() => {
    if (!battle) {
      navigate('/', { replace: true });
      return;
    }
    // A retry starts a new battle without unmounting this screen – reset the
    // "already showed the result" latch so the next victory/defeat triggers again.
    if (battleIdRef.current !== battle.id) {
      battleIdRef.current = battle.id;
      finished.current = false;
      if (doneTimer.current) window.clearTimeout(doneTimer.current);
    }
    drive();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      // Orphans any animation still in flight so it does not restart the loop afterwards.
      // (A counter, not a DOM ref – reading it at cleanup time is the point.)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runId.current++;
      busy.current = false;
    };
    // The turn loop is self-driven through timers; only (re)start it when the battle or auto changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle?.id, auto]);

  useEffect(
    () => () => {
      if (doneTimer.current) window.clearTimeout(doneTimer.current);
      // leaving the screen clears the battle
      if (useCombatStore.getState().summary) clear();
      useBattleLayoutStore.getState().setEditing(false);
    },
    [clear],
  );

  // "Your turn": focus the active unit (the animator defers this until a running attack ends).
  const focusId = battle && battle.result === 'ongoing' ? battle.activeId : null;
  useEffect(() => animator.setFocus(focusId), [animator, focusId]);

  if (!battle) return null;

  const heroes = battle.combatants.filter((c) => c.side === 'hero');
  const enemies = battle.combatants.filter((c) => c.side === 'enemy');
  const byUid = new Map(battle.combatants.map((c) => [c.uid, c]));

  /**
   * Formation units keep their slots for the whole battle; summons land on a free spot
   * anywhere on their side's half, picked once, so a summon never moves or shrinks anyone.
   */
  const sideViews = (list: Combatant[], side: Combatant['side']) => {
    const formation = formationSlots(list.filter((c) => !c.summoned).length, side);
    const spots = summonSpots.current;
    const views: ActorView[] = [];
    for (const c of list) {
      // A dead summon leaves the field once the stage has played its death.
      if (c.summoned && !c.alive && animator.isDead(c.uid)) continue;
      let spot: SlotPos | undefined;
      if (c.summoned) {
        spot = spots.get(c.uid);
        if (!spot) {
          const taken = list
            .filter((o) => o.summoned && o.alive && spots.has(o.uid))
            .map((o) => spots.get(o.uid)!);
          spot = pickSummonSpot(c.uid, side, [...formation, ...taken]);
          spots.set(c.uid, spot);
        }
      }
      const v = toView(c, spot, !!forms[c.uid]);
      if (v) views.push(v);
    }
    return views;
  };
  const heroViews = sideViews(heroes, 'hero');
  const enemyViews = sideViews(enemies, 'enemy');
  // Same key as the debug panel, its export and data/battleLayouts.ts, so shipped positions
  // apply and "reset" clears what is on screen.
  const stageMapKey = mapKey;
  const layoutSide = (side: Combatant['side']) => (side === 'hero' ? 'heroes' : 'enemies');

  const active = battle.activeId
    ? battle.combatants.find((c) => c.uid === battle.activeId)
    : undefined;
  const playerTurn = !!active && active.side === 'hero' && !auto && battle.result === 'ongoing';
  const selectedSkill =
    playerTurn && selectedSkillId ? active.skills.find((s) => s.id === selectedSkillId) : undefined;
  const targets = selectedSkill && active ? validTargets(battle, active, selectedSkill) : [];
  const needsTarget = (s: SkillDef) =>
    ['enemy', 'chain', 'ally', 'lowestAlly', 'deadAlly'].includes(s.target);

  const onSkill = (s: SkillDef) => {
    if (!playerTurn || !active || !canUseSkill(battle, active, s)) return;
    haptic('light');
    if (needsTarget(s)) {
      if (selectedSkillId === s.id) setSelectedSkill(null);
      else setSelectedSkill(s.id);
      return;
    }
    doAct(s.id);
  };

  const doAct = (skillId: string, targetUid?: string) => {
    if (busy.current) return;
    busy.current = true;
    const events = act(skillId, targetUid);
    const run = runId.current;
    void playEvents(events).then(() => {
      if (run !== runId.current) return;
      busy.current = false;
      timer.current = window.setTimeout(drive, delay(250));
    });
  };

  const onUnitClick = (c: Combatant) => {
    if (!selectedSkill || !targets.some((x) => x.uid === c.uid)) return;
    haptic('medium');
    doAct(selectedSkill.id, c.uid);
  };

  // Boss HP panel is only shown when the encounter has a boss
  const boss = enemies.find((e) => e.isBoss);
  const stageTitle =
    config?.mode === 'arena'
      ? t('pvp:title')
      : config?.stageId
        ? `${t(`world-map:regions.${getStage(config.stageId).regionId}.name`)} ${getStage(config.stageId).index} · ${t(`dungeon:stages.${config.stageId}.name`)}`
        : '';
  const stageBg = stageArt(config?.stageId);

  const retreat = () => {
    clear();
    navigate(-1);
  };

  return (
    <div
      className="screen bg-battle"
      style={
        stageBg
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(10, 6, 20, 0.55) 0%, rgba(10, 6, 20, 0) 30%, rgba(10, 6, 20, 0.5) 100%), url('${stageBg}')`,
            }
          : undefined
      }
    >
      {positionEditing && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-center pt-1">
          <span className="rounded-b-md border border-t-0 border-gold/60 bg-black/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-2">
            Position editor · drag units · saved for {stageMapKey}
          </span>
        </div>
      )}
      {/* Top bar: boss panel · stage title · pause */}
      <div className="relative z-20 flex h-[46px] shrink-0 items-start justify-between px-3 pt-2">
        <BossPanel boss={boss} t={t} />
        <div className="pointer-events-none absolute left-1/2 top-2 flex -translate-x-1/2 flex-col items-center leading-tight">
          <span className="gold-gradient-text whitespace-nowrap font-display text-[13px] font-black uppercase tracking-[0.2em]">
            {stageTitle}
          </span>
          <span className="text-[9px] text-ink-dim">
            {t('combat:round', { n: battle.round })}
            {active && battle.result === 'ongoing' && (
              <span className={active.side === 'hero' ? 'text-gold-2' : 'text-blood-2'}>
                {' · '}
                {active.name}
              </span>
            )}
          </span>
          {selectedSkill && (
            <span className="mt-0.5 animate-pulse rounded-full bg-purple/50 px-2 text-[9px] text-purple-2">
              {t('combat:choose_target')}
            </span>
          )}
        </div>
        <button
          onClick={retreat}
          title={t('combat:retreat')}
          className="btn-press flex h-8 w-8 items-center justify-center rounded-md border border-gold/60 bg-black/60 text-[14px] text-gold"
        >
          ⏸
        </button>
      </div>

      {/* Battlefield – still actors on the combat stage. Elevated above the top/skill bars so
          HUDs and custom-positioned units are never hidden behind them. */}
      <CombatStage
        className="z-30 min-h-0 flex-1"
        clip={false}
        heroes={heroViews}
        enemies={enemyViews}
        animator={animator}
        floor="5%"
        insetRight={78}
        onActorSelect={(id) => {
          const c = byUid.get(id);
          if (c) onUnitClick(c);
        }}
        renderSlot={(view, boxHeight) => {
          const c = byUid.get(view.id);
          if (!c) return null;
          return (
            <UnitHud
              unit={c}
              enemy={c.side === 'enemy'}
              boxHeight={boxHeight}
              active={c.uid === battle.activeId}
              targetable={targets.some((x) => x.uid === c.uid)}
              castingSkill={lastSkill?.actorId === c.uid ? lastSkill : null}
            />
          );
        }}
        slotOffset={(side, i) => getPositionOffset(stageMapKey, layoutSide(side), i)}
        editable={positionEditing}
        onSlotOffsetChange={(side, i, o) => setPositionOffset(stageMapKey, layoutSide(side), i, o)}
      >
        {/* Party column – right edge */}
        <div className="absolute right-2 top-0 z-[70] flex flex-col gap-1">
          {heroes.map((c) => (
            <PartyPortrait key={c.uid} unit={c} active={c.uid === battle.activeId} />
          ))}
        </div>
      </CombatStage>

      {/* Skill bar */}
      <div className="relative z-20 flex h-[70px] shrink-0 items-end justify-between px-3 pb-2">
        <div className="text-[10px] uppercase tracking-widest text-ink-dim">
          {battle.result !== 'ongoing'
            ? battle.result === 'victory'
              ? t('combat:victory')
              : t('combat:defeat')
            : active?.side === 'hero'
              ? auto
                ? t('combat:auto')
                : t('combat:your_turn')
              : t('combat:enemy_turn')}
        </div>
        <div className="flex items-end gap-1.5">
          {active && active.side === 'hero' && battle.result === 'ongoing' && (
            <div className="flex items-end gap-1.5">
              {active.skills.map((s) => (
                <SkillButton
                  key={s.id}
                  skill={s}
                  cooldown={active.cooldowns[s.id] ?? 0}
                  usable={canUseSkill(battle, active, s) && playerTurn}
                  selected={selectedSkillId === s.id}
                  onClick={() => onSkill(s)}
                  level={active.skillLevels[s.id] ?? 1}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => {
              haptic('light');
              setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : 1);
            }}
            className="btn-press ml-2 flex h-[54px] w-[54px] items-center justify-center rounded-lg border-2 border-gold/60 bg-black/70 font-display text-[16px] font-black text-gold-2"
          >
            x{speed}
          </button>
          <button
            onClick={() => {
              haptic('light');
              setAuto(!auto);
              setSelectedSkill(null);
            }}
            className={`btn-press flex h-[54px] w-[54px] items-center justify-center rounded-lg border-2 font-display text-[11px] font-black uppercase tracking-wider ${
              auto
                ? 'border-[#ffe9a8] bg-gradient-to-b from-[#f2d06b] to-[#9c7d24] text-[#1a1205]'
                : 'border-gold/60 bg-black/70 text-gold-2'
            }`}
          >
            {t('combat:auto')}
          </button>
        </div>
      </div>

      {summary && <ResultModal summary={summary} result={battle.result} config={config!} />}
    </div>
  );
}

function BossPanel({
  boss,
  t,
}: {
  boss?: Combatant;
  t: (k: string, o?: Record<string, unknown>) => string;
}) {
  if (!boss) return <div />;
  const shield = boss.statuses.filter((s) => s.id === 'shield').reduce((a, s) => a + s.value, 0);
  return (
    <div className="w-[190px]">
      <div className="flex items-center justify-between">
        <span className="font-display text-[11px] font-bold uppercase tracking-wider text-ink drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {boss.name}
        </span>
        <span className="text-[9px] text-ink-dim">Lv {boss.level}</span>
      </div>
      <ProgressBar
        value={boss.hp}
        max={boss.maxHp}
        height={10}
        color="#e74c3c"
        label={`${formatNumber(boss.hp)} / ${formatNumber(boss.maxHp)}`}
        className="border-gold/50"
      />
      {shield > 0 && (
        <ProgressBar
          value={shield}
          max={boss.maxHp}
          height={4}
          color="#8fd8ff"
          className="mt-[2px]"
        />
      )}
      <div className="mt-0.5 flex gap-[3px]">
        {boss.statuses.slice(0, 6).map((s, i) => (
          <span
            key={i}
            title={t(`combat:status.${s.id}`)}
            className="rounded bg-black/70 px-[3px] text-[9px] leading-[14px]"
          >
            {STATUS_GLYPH[s.id] ?? '•'}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillButton({
  skill,
  cooldown,
  usable,
  selected,
  onClick,
  level,
}: {
  skill: SkillDef;
  cooldown: number;
  usable: boolean;
  selected: boolean;
  onClick: () => void;
  level: number;
}) {
  const { t } = useTranslation('heroes');
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (selected && ref.current)
      gsap.fromTo(
        ref.current,
        { scale: 0.9 },
        { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1 },
      );
  }, [selected]);
  const isUlt = skill.kind === 'ultimate';
  const name = t(`skills.${skill.id}.name`);
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={!usable}
      title={`${name} · ${t(`skills.${skill.id}.desc`)}`}
      className={`btn-press relative flex h-[54px] w-[54px] shrink-0 flex-col items-center justify-center rounded-lg border-2 transition-all ${
        selected
          ? 'border-[#ffe9a8] shadow-[0_0_16px_rgba(242,208,107,0.8)]'
          : isUlt
            ? 'border-purple-2/80 shadow-[0_0_10px_rgba(179,136,255,0.5)]'
            : 'border-gold/70'
      } ${usable ? '' : 'opacity-60'}`}
      style={{
        background: isUlt
          ? 'radial-gradient(circle at 50% 30%, rgba(179,136,255,0.55), rgba(20,10,40,0.95) 70%)'
          : 'radial-gradient(circle at 50% 30%, rgba(242,208,107,0.35), rgba(20,15,30,0.95) 70%)',
      }}
    >
      <span className="text-[24px] leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
        {skill.glyph}
      </span>
      <span className="absolute bottom-[2px] left-1 text-[7px] font-bold text-ink-dim">
        Lv{level}
      </span>
      <span className="absolute bottom-[2px] right-1 text-[7px] font-bold uppercase text-gold-2">
        {isUlt ? 'ULT' : skill.kind === 'basic' ? '' : `CD${skill.cooldown}`}
      </span>
      <span className="pointer-events-none absolute -top-[14px] left-1/2 max-w-[58px] -translate-x-1/2 truncate whitespace-nowrap text-[8px] font-semibold text-ink drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        {name}
      </span>
      {cooldown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/75 font-display text-[22px] font-black text-white">
          {cooldown}
        </div>
      )}
    </button>
  );
}
