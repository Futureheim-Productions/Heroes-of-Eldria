import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import type { Combatant } from '@/types';
import { HeroPortrait } from '@/components/game/HeroPortrait';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HERO_MAP } from '@/data/heroes';

export const STATUS_GLYPH: Record<string, string> = {
  shield: '🛡',
  poison: '☠️',
  bleed: '🩸',
  burn: '🔥',
  atkUp: '⚔️↑',
  atkDown: '⚔️↓',
  defUp: '🛡↑',
  defDown: '🛡↓',
  spdDown: '🐢',
  spdUp: '💨',
  stun: '💫',
  freeze: '🧊',
  stealth: '👤',
  ccImmune: '🔰',
  debuffImmune: '✨',
  lifesteal: '🧛',
  taunt: '😤',
  charm: '💞',
  magicUp: '🔮',
  soulLink: '🔗',
  regen: '💚',
  dragonForm: '🐲',
  evasion: '🌀',
  reflect: '🪞',
  reviveOnce: '♻️',
  web: '🕸️',
  rage: '💢',
  defensiveForm: '🧱',
  haste: '⏩',
};

interface UnitHudProps {
  unit: Combatant;
  enemy?: boolean;
  /** Height of the actor's box – the HUD floats just above it. */
  boxHeight: number;
  active: boolean;
  targetable: boolean;
  castingSkill: { skillId: string; key: number } | null;
}

/**
 * Name, HP, shield and statuses above a still actor, plus the ground ring for "your turn" /
 * "valid target". Lives in the actor's slot on the combat stage, so step-ins and knockbacks
 * never drag the bars along.
 */
export function UnitHud({
  unit,
  enemy,
  boxHeight,
  active,
  targetable,
  castingSkill,
}: UnitHudProps) {
  const { t } = useTranslation(['combat', 'heroes']);
  const skillRef = useRef<HTMLDivElement>(null);
  const shield = unit.statuses.filter((s) => s.id === 'shield').reduce((a, s) => a + s.value, 0);
  const boxW = Math.round(Math.max(64, Math.min(96, boxHeight * 0.55)));
  const ringW = Math.round(boxHeight * 0.55);

  useEffect(() => {
    if (!castingSkill || !skillRef.current) return;
    const el = skillRef.current;
    const tl = gsap
      .timeline()
      .fromTo(
        el,
        { opacity: 0, y: 6, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'back.out(2)' },
      )
      .to(el, { opacity: 0, duration: 0.3 }, 1);
    return () => {
      tl.kill();
    };
  }, [castingSkill]);

  if (!unit.alive) return null;

  const skillName = castingSkill
    ? (t(`heroes:skills.${castingSkill.skillId.replace(/^mirror_/, '')}.name`, {
        defaultValue: '',
      }) as string) ||
      unit.skills.find((s) => s.id === castingSkill.skillId)?.glyph ||
      ''
    : '';

  return (
    <>
      {/* Ground ring – under the feet, behind the art */}
      {(targetable || active) && (
        <div
          className={`pointer-events-none absolute rounded-[50%] ${
            targetable
              ? 'animate-pulse border-2 border-blood-2 bg-blood/40 shadow-[0_0_14px_rgba(255,107,91,0.8)]'
              : 'border border-gold/70 bg-gold/20 shadow-[0_0_12px_rgba(212,175,55,0.6)]'
          }`}
          style={{ left: -ringW / 2, bottom: -8, width: ringW, height: 16, zIndex: -1 }}
        />
      )}
      <div
        className="pointer-events-none absolute"
        style={{ left: -boxW / 2, bottom: boxHeight + 4, width: boxW, zIndex: 5 }}
      >
        <div
          ref={skillRef}
          className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-gold/50 bg-black/85 px-1.5 py-[1px] text-[9px] font-bold text-gold-2 opacity-0"
        >
          {skillName}
        </div>
        <div className="truncate text-center text-[9px] font-semibold leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {unit.name}
        </div>
        <ProgressBar
          value={unit.hp}
          max={unit.maxHp}
          height={7}
          color={enemy ? '#e74c3c' : '#45d17c'}
        />
        {shield > 0 && (
          <ProgressBar
            value={shield}
            max={unit.maxHp}
            height={3}
            color="#8fd8ff"
            className="mt-[1px]"
          />
        )}
        {unit.statuses.length > 0 && (
          <div className="mt-[2px] flex flex-wrap justify-center gap-[2px]">
            {unit.statuses.slice(0, 5).map((s, i) => (
              <span
                key={i}
                className="rounded bg-black/70 px-[2px] text-[8px] leading-[11px]"
                title={t(`combat:status.${s.id}`)}
              >
                {STATUS_GLYPH[s.id] ?? '•'}
                {s.turns < 999 && <span className="text-ink-dim">{s.turns}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/** Compact hero portrait for the party column on the right. */
export function PartyPortrait({ unit, active }: { unit: Combatant; active: boolean }) {
  const def = HERO_MAP[unit.defId];
  return (
    <div
      className={`w-[60px] rounded-md border p-[3px] ${active ? 'border-gold bg-gold/25 shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'border-gold/40 bg-black/60'} ${unit.alive ? '' : 'opacity-40'}`}
    >
      <div className="flex items-center gap-1">
        <HeroPortrait
          heroId={def ? unit.defId : undefined}
          glyph={unit.glyph}
          element={unit.element}
          rarity={unit.rarity}
          size={26}
          dead={!unit.alive}
          className="!rounded"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[7px] font-bold text-gold-2">Lv {unit.level}</div>
          <div className="text-[7px] tabular-nums text-ink-dim">
            {Math.round((unit.gauge / 1000) * 100)}%
          </div>
        </div>
      </div>
      <ProgressBar value={unit.hp} max={unit.maxHp} height={4} className="mt-[2px]" />
    </div>
  );
}
