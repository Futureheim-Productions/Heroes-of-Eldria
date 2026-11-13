import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import type { SkillDef } from '@/types';
import { CombatStage } from '../camera/CombatStage';
import { useCombatAnimator } from '../timeline/useCombatAnimator';
import { heroView, monsterView } from '../actorViews';
import type { ActorClass, ActorView } from '../types';
import { HEROES, HERO_MAP } from '@/data/heroes';
import { MONSTERS, MONSTER_MAP } from '@/data/monsters';
import {
  ALL_SPELL_FX,
  SPELL_FX,
  fxVariants,
  skillFx,
  skillFxId,
  type SpellFxId,
} from '@/data/spellFx';
import { heroForm } from '@/data/heroForms';
import { preloadSheets, type SpriteSheetConfig } from '@/utils/spriteSheet';

const CLASSES: ActorClass[] = ['warrior', 'tank', 'mage', 'assassin', 'archer', 'necro'];
const FX_IDS = Object.keys(SPELL_FX) as SpellFxId[];
/** Skill targets that hit the other side; everything else is cast on the own side. */
const OFFENSIVE = ['enemy', 'enemies', 'randomEnemies', 'chain', 'weakestEnemy'];
const MULTI = ['enemies', 'randomEnemies', 'chain'];
const NONE = '';

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const prettify = (id: string) => id.replace(/_/g, ' ');

/** Slot uid → def id: `h0_kael` → `kael`. */
const defOf = (uid: string) => uid.slice(uid.indexOf('_') + 1);

/**
 * #/debug/combat – test bench for the still-actor combat: put any heroes and monsters on the
 * stage, then play their real skills (with their real effect) or any effect / motion preset
 * on them. Click an actor on your own side to make it the attacker, on the other side to make
 * it the target.
 */
export default function CombatTestScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation(['heroes', 'monsters']);
  const [speed, setSpeed] = useState(1);
  const animator = useCombatAnimator(speed);

  const [heroIds, setHeroIds] = useState(['kael', 'nera', 'elarion']);
  const [enemyIds, setEnemyIds] = useState(['black_knight', 'lich', NONE]);
  const [attacker, setAttacker] = useState('h0_kael');
  const [target, setTarget] = useState('e0_black_knight');
  /** Effect override: '' = the skill's own effect, 'none' = no effect. */
  const [fxChoice, setFxChoice] = useState<SpellFxId | '' | 'none'>('');
  const [motion, setMotion] = useState<ActorClass | ''>('');
  const [crit, setCrit] = useState(false);
  const [forms, setForms] = useState<Record<string, boolean>>({});
  const [looping, setLooping] = useState(false);
  const loopRef = useRef(false);

  const nameOf = (defId: string) =>
    defId in HERO_MAP
      ? t(`heroes:${defId}.name`, { defaultValue: prettify(defId) })
      : t(`monsters:${defId}.name`, { defaultValue: prettify(defId) });

  const heroes = useMemo(
    () =>
      heroIds.flatMap((id, i) => {
        if (!id) return [];
        const uid = `h${i}_${id}`;
        const v = heroView(id, { uid, name: nameOf(id) });
        const form = forms[uid] ? heroForm(id) : undefined;
        if (!v) return [];
        return [form ? { ...v, artSrc: form.art, aspect: form.aspect, sizeScale: form.scale } : v];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [heroIds, forms],
  );
  const enemies = useMemo(
    () =>
      enemyIds.flatMap((id, i) => {
        if (!id) return [];
        const uid = `e${i}_${id}`;
        const v =
          id in HERO_MAP
            ? heroView(id, { uid, side: 'enemy', name: nameOf(id) })
            : monsterView(id, { uid, name: nameOf(id) });
        return v ? [v] : [];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enemyIds],
  );
  const all = useMemo(() => [...heroes, ...enemies], [heroes, enemies]);
  const byUid = (uid: string) => all.find((a) => a.id === uid);

  useEffect(() => preloadSheets(ALL_SPELL_FX), []);
  useEffect(
    () => () => {
      loopRef.current = false;
    },
    [],
  );

  // Keep attacker / target pointing at someone who is actually on the stage.
  const attackerView = byUid(attacker) ?? heroes[0] ?? enemies[0];
  const targetView =
    (byUid(target)?.side !== attackerView?.side ? byUid(target) : undefined) ??
    all.find((a) => a.side !== attackerView?.side);

  const onActorSelect = (uid: string) => {
    const v = byUid(uid);
    if (!v || !attackerView) return;
    if (v.side === attackerView.side) setAttacker(uid);
    else setTarget(uid);
  };

  const skillsOf = (uid: string): SkillDef[] => {
    const id = defOf(uid);
    return HERO_MAP[id]?.skills ?? MONSTER_MAP[id]?.skills ?? [];
  };

  const sheetFor = (skill?: SkillDef): SpriteSheetConfig | undefined => {
    if (fxChoice === 'none') return undefined;
    if (fxChoice) return SPELL_FX[fxChoice];
    return skill ? skillFx(skill) : undefined;
  };

  const opponents = (of: ActorView) =>
    all.filter((a) => a.side !== of.side && !animator.isDead(a.id));

  /** One attack from `from` on `to` (plus the rest of that side when `aoe`). */
  const strike = (
    from: ActorView,
    to: ActorView,
    o: { sheet?: SpriteSheetConfig; ult?: boolean; aoe?: boolean; crit?: boolean } = {},
  ) => {
    if (animator.isDead(from.id) || animator.isDead(to.id)) return Promise.resolve();
    const isCrit = o.crit ?? crit;
    const extraHits = o.aoe
      ? opponents(from)
          .filter((a) => a.id !== to.id)
          .map((a) => ({ targetId: a.id, damage: rand(300, 700) }))
      : [];
    return animator.playAttack({
      actorId: from.id,
      targetId: to.id,
      damage: isCrit ? rand(1800, 2600) : rand(400, 900),
      isCrit,
      ult: o.ult,
      sheet: o.sheet,
      classOverride: motion || undefined,
      extraHits,
    });
  };

  /** Plays a real skill: transformation first if it grants a form, then attack or cast. */
  const playSkill = async (skill: SkillDef) => {
    const from = attackerView;
    if (!from || animator.isDead(from.id)) return;
    const form = heroForm(defOf(from.id));
    if (
      form &&
      !forms[from.id] &&
      skill.effects.some(
        (e) => e.kind === 'status' && e.status === form.status && e.target === 'self',
      )
    )
      await animator.playTransform(from.id, SPELL_FX[form.transformFx], () =>
        setForms((f) => ({ ...f, [from.id]: true })),
      );
    const deals = skill.effects.some((e) => e.kind === 'damage');
    if (!OFFENSIVE.includes(skill.target) || !deals || !targetView) {
      await animator.playCast(from.id);
      return;
    }
    await strike(from, targetView, {
      sheet: sheetFor(skill),
      ult: skill.kind === 'ultimate',
      aoe: MULTI.includes(skill.target),
    });
  };

  const autoLoop = async () => {
    if (loopRef.current) {
      loopRef.current = false;
      setLooping(false);
      return;
    }
    loopRef.current = true;
    setLooping(true);
    let turn = 0;
    while (loopRef.current) {
      const alive = all.filter((a) => !animator.isDead(a.id));
      if (!alive.some((a) => a.side === 'hero') || !alive.some((a) => a.side === 'enemy')) break;
      const from = alive[turn++ % alive.length];
      const to = opponents(from)[0];
      const skills = skillsOf(from.id).filter((s) => s.effects.some((e) => e.kind === 'damage'));
      const skill = skills[Math.floor(Math.random() * skills.length)];
      animator.setFocus(from.id);
      await new Promise((r) => gsap.delayedCall(0.18 / animator.timeScale, r));
      if (to)
        await strike(from, to, {
          sheet: sheetFor(skill),
          ult: skill?.kind === 'ultimate',
          crit: Math.random() < 0.2,
        });
      await new Promise((r) => gsap.delayedCall(0.12 / animator.timeScale, r));
    }
    animator.setFocus(null);
    loopRef.current = false;
    setLooping(false);
  };

  const reset = () => {
    loopRef.current = false;
    setForms({});
    animator.resetBattle();
  };

  const setSlot = (side: 'hero' | 'enemy', i: number, id: string) => {
    const set = side === 'hero' ? setHeroIds : setEnemyIds;
    set((ids) => ids.map((x, j) => (j === i ? id : x)));
    setForms({});
  };

  const btn =
    'btn-press rounded-md border border-gold/60 bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-2 disabled:opacity-40';
  const sel = 'rounded border border-gold/40 bg-black/80 px-1 py-0.5 text-[10px] text-ink';

  const attackerSkills = attackerView ? skillsOf(attackerView.id) : [];

  return (
    <div className="absolute inset-0 flex flex-col bg-bg">
      <CombatStage
        className="min-h-0 flex-1"
        heroes={heroes}
        enemies={enemies}
        animator={animator}
        onActorSelect={onActorSelect}
        background="linear-gradient(180deg, rgba(10,6,20,.55), rgba(10,6,20,0) 35%, rgba(10,6,20,.5)), url('bg-battle.jpg') center / cover"
      >
        <div className="pointer-events-none absolute left-2 top-2 z-[100] flex flex-col gap-1 text-[10px]">
          <button
            className="pointer-events-auto btn-press w-fit rounded border border-gold/50 bg-black/70 px-2 py-0.5 text-gold-2"
            onClick={() => navigate('/')}
          >
            ← Meny
          </button>
          <span className="rounded bg-black/70 px-2 py-0.5 text-ink">
            Anfaller: <b className="text-gold-2">{attackerView?.name ?? '–'}</b>
            {attackerView && <span className="text-ink-dim"> ({attackerView.classId})</span>}
            {' → '}Mål: <b className="text-blood-2">{targetView?.name ?? '–'}</b>
          </span>
          <span className="rounded bg-black/70 px-2 py-0.5 text-ink-dim">
            Klicka egen sida = anfallare · andra sidan = mål · ⇄ Byt = fienden anfaller
          </span>
        </div>
        <TweenDebug speed={speed} />
      </CombatStage>

      <div className="flex shrink-0 flex-col gap-1 border-t border-gold/30 bg-black/85 px-2 py-1.5">
        {/* Line-up */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] uppercase text-ink-dim">Hjältar</span>
          {heroIds.map((id, i) => (
            <select
              key={`h${i}`}
              className={sel}
              value={id}
              onChange={(e) => setSlot('hero', i, e.target.value)}
            >
              <option value={NONE}>–</option>
              {HEROES.map((h) => (
                <option key={h.id} value={h.id}>
                  {nameOf(h.id)}
                </option>
              ))}
            </select>
          ))}
          <span className="ml-2 text-[10px] uppercase text-ink-dim">Fiender</span>
          {enemyIds.map((id, i) => (
            <select
              key={`e${i}`}
              className={sel}
              value={id}
              onChange={(e) => setSlot('enemy', i, e.target.value)}
            >
              <option value={NONE}>–</option>
              <optgroup label="Monster">
                {MONSTERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {nameOf(m.id)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Hjältar (arena)">
                {HEROES.map((h) => (
                  <option key={h.id} value={h.id}>
                    {nameOf(h.id)}
                  </option>
                ))}
              </optgroup>
            </select>
          ))}
        </div>

        {/* Attacker's real skills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] uppercase text-ink-dim">Skills</span>
          {attackerSkills.map((s) => {
            // Id only – calling skillFx here would consume a random variant pick on every render.
            const fxId = skillFxId(s);
            const looks = fxId ? fxVariants(fxId).join(' / ') : '–';
            return (
              <button
                key={s.id}
                className={`${btn} ${s.kind === 'ultimate' ? '!border-purple-2/80 !text-purple-2' : ''}`}
                title={`${s.kind} · ${s.target} · fx: ${looks}`}
                onClick={() => playSkill(s)}
              >
                {s.glyph} {t(`heroes:skills.${s.id}.name`, { defaultValue: prettify(s.id) })}
              </button>
            );
          })}
        </div>

        {/* Effect / motion / reactions */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] uppercase text-ink-dim">Effekt</span>
          <select
            className={sel}
            value={fxChoice}
            onChange={(e) => setFxChoice(e.target.value as SpellFxId | '' | 'none')}
          >
            <option value="">skillens egen</option>
            <option value="none">ingen</option>
            {FX_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <button
            className={btn}
            disabled={!attackerView || !targetView}
            onClick={() =>
              attackerView &&
              targetView &&
              strike(attackerView, targetView, {
                sheet: fxChoice && fxChoice !== 'none' ? SPELL_FX[fxChoice] : undefined,
              })
            }
          >
            Spela effekt
          </button>
          <span className="ml-1 text-[10px] uppercase text-ink-dim">Rörelse</span>
          <select
            className={sel}
            value={motion}
            onChange={(e) => setMotion(e.target.value as ActorClass | '')}
          >
            <option value="">klassens egen</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-[10px] text-ink">
            <input type="checkbox" checked={crit} onChange={(e) => setCrit(e.target.checked)} />
            crit
          </label>
          <span className="mx-1 h-4 w-px bg-gold/30" />
          <button
            className={btn}
            title="Byt anfallare och mål – så en fiende kan anfalla"
            disabled={!attackerView || !targetView}
            onClick={() => {
              if (!attackerView || !targetView) return;
              setAttacker(targetView.id);
              setTarget(attackerView.id);
            }}
          >
            ⇄ Byt
          </button>
          <button
            className={btn}
            onClick={() => attackerView && animator.setFocus(attackerView.id)}
          >
            Focus
          </button>
          <button className={btn} onClick={() => animator.setFocus(null)}>
            Idle
          </button>
          <button
            className={btn}
            onClick={() =>
              targetView && animator.playHit(targetView.id, { damage: rand(300, 800) })
            }
          >
            Hit
          </button>
          <button className={btn} onClick={() => targetView && animator.playDeath(targetView.id)}>
            Death
          </button>
          <button className={btn} onClick={() => animator.skip()}>
            Skip
          </button>
          <button
            className={`${btn} ${speed > 1 ? '!bg-gold !text-black' : ''}`}
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : 1)}
          >
            x{speed}
          </button>
          <button className={btn} onClick={autoLoop}>
            {looping ? 'Stop auto' : 'Auto'}
          </button>
          <button className={btn} onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/** Live count of running GSAP tweens. */
function TweenDebug({ speed }: { speed: number }) {
  const [info, setInfo] = useState({ active: 0, total: 0 });
  useEffect(() => {
    const tick = () => {
      const tweens = gsap.globalTimeline.getChildren(true, true, false);
      setInfo({ active: tweens.filter((tw) => tw.isActive()).length, total: tweens.length });
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="pointer-events-none absolute right-2 top-2 z-[100] rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-[#9fe]">
      tweens {info.active} active / {info.total} · x{speed}
    </div>
  );
}
