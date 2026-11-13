import type {
  BattleEvent,
  BattleState,
  Combatant,
  Effect,
  EffectTarget,
  HeroDef,
  MonsterDef,
  OwnedHero,
  SkillDef,
  Stats,
  StatusId,
  StatusInstance,
} from '@/types';
import { CC_STATUSES, DEBUFFS } from '@/types/combat';
import { getMonsterDef } from '@/data/monsters';
import { Rng } from './rng';
import { monsterStats, skillLevelMult } from './stats';
import { ELEMENT_ADVANTAGE, ELEMENT_ADV_MULT, ELEMENT_DISADV_MULT } from './constants';

const GAUGE_MAX = 1000;
const MAX_TURNS = 250;

/**
 * Armor constant in `1000 / (1000 + 4 * DEF)`. DEF grows ~6% of base per level, so with a fixed
 * constant mitigation creeps toward 100% in the late regions. Up to level 50 it stays 1000 (the
 * original balance); above that it grows with the attacker's level so mitigation holds at the
 * level-50 ratio.
 */
export function armorConstant(attackerLevel: number): number {
  if (attackerLevel <= 50) return 1000;
  return (1000 * (1 + 0.06 * (attackerLevel - 1))) / (1 + 0.06 * 49);
}

// ───────────────────────── Creation ─────────────────────────

export function createHeroCombatant(
  def: HeroDef,
  owned: OwnedHero,
  stats: Stats,
  name: string,
): Combatant {
  return {
    uid: `h_${def.id}`,
    defId: def.id,
    side: 'hero',
    name,
    glyph: def.glyph,
    element: def.element,
    rarity: def.rarity,
    level: owned.level,
    tags: def.tags ?? [],
    base: stats,
    hp: stats.hp,
    maxHp: stats.hp,
    skills: def.skills,
    cooldowns: {},
    statuses: [],
    alive: true,
    gauge: 0,
    skillLevels: owned.skillLevels,
    skin: owned.skin,
  };
}

export function createMonsterCombatant(
  def: MonsterDef,
  level: number,
  mult: number,
  name: string,
  suffix: string,
  boss = false,
): Combatant {
  const stats = monsterStats(def, level, mult * (boss ? 1.25 : 1));
  const statuses: StatusInstance[] = (def.passives ?? []).map((p) => ({
    id: p.status,
    turns: 999,
    value: p.value ?? 0,
  }));
  return {
    uid: `e_${def.id}_${suffix}`,
    defId: def.id,
    side: 'enemy',
    name,
    glyph: def.glyph,
    element: def.element,
    rarity: def.rarity,
    level,
    tags: [...def.tags],
    base: stats,
    hp: stats.hp,
    maxHp: stats.hp,
    skills: def.skills,
    cooldowns: {},
    statuses,
    alive: true,
    gauge: 0,
    isBoss: boss || def.isBoss,
    skillLevels: {},
  };
}

export function createBattle(
  id: string,
  heroes: Combatant[],
  enemies: Combatant[],
  seed: number,
): BattleState {
  const combatants = [...heroes, ...enemies];
  // Mirror warden copies the strongest hero ultimate
  for (const c of combatants) {
    if (c.tags.includes('mirror')) {
      const strongest = [...heroes].sort((a, b) => b.base.atk - a.base.atk)[0];
      const ult = strongest?.skills.find((s) => s.kind === 'ultimate');
      if (ult)
        c.skills = [
          ...c.skills,
          { ...ult, id: `mirror_${ult.id}`, cooldown: Math.max(3, ult.cooldown) },
        ];
    }
  }
  return {
    id,
    round: 1,
    combatants,
    activeId: null,
    log: [{ type: 'info', text: 'battle_start' }],
    result: 'ongoing',
    turnCount: 0,
    seed,
  };
}

// ───────────────────────── Helpers ─────────────────────────

function clone(state: BattleState): BattleState {
  return {
    ...state,
    combatants: state.combatants.map((c) => ({
      ...c,
      cooldowns: { ...c.cooldowns },
      statuses: c.statuses.map((s) => ({ ...s })),
      tags: [...c.tags],
    })),
    log: [...state.log],
  };
}

function rngFor(state: BattleState): Rng {
  return new Rng(state.seed + state.turnCount * 7919 + state.log.length * 104729);
}

export function getStatus(c: Combatant, id: StatusId): StatusInstance | undefined {
  return c.statuses.find((s) => s.id === id);
}

export function hasStatus(c: Combatant, id: StatusId): boolean {
  return c.statuses.some((s) => s.id === id);
}

function statusValue(c: Combatant, id: StatusId): number {
  return c.statuses.filter((s) => s.id === id).reduce((a, s) => a + s.value, 0);
}

export function effectiveAtk(c: Combatant, magic = false): number {
  let mod =
    statusValue(c, 'atkUp') -
    statusValue(c, 'atkDown') +
    statusValue(c, 'dragonForm') +
    statusValue(c, 'rage');
  if (magic) mod += statusValue(c, 'magicUp');
  return c.base.atk * Math.max(0.2, 1 + mod / 100);
}

export function effectiveDef(c: Combatant): number {
  const mod = statusValue(c, 'defUp') - statusValue(c, 'defDown') + statusValue(c, 'defensiveForm');
  return c.base.def * Math.max(0.1, 1 + mod / 100);
}

export function effectiveSpd(c: Combatant): number {
  const mod = statusValue(c, 'spdUp') - statusValue(c, 'spdDown');
  return c.base.spd * Math.max(0.3, 1 + mod / 100);
}

export function alliesOf(state: BattleState, c: Combatant): Combatant[] {
  return state.combatants.filter((x) => x.side === c.side && x.alive);
}

export function enemiesOf(state: BattleState, c: Combatant): Combatant[] {
  return state.combatants.filter((x) => x.side !== c.side && x.alive);
}

function find(state: BattleState, uid: string): Combatant {
  const c = state.combatants.find((x) => x.uid === uid);
  if (!c) throw new Error(`No combatant ${uid}`);
  return c;
}

export function isDebuffed(c: Combatant): boolean {
  return c.statuses.some((s) => DEBUFFS.includes(s.id));
}

export function isCrowdControlled(c: Combatant): boolean {
  return c.statuses.some((s) => s.id === 'stun' || s.id === 'freeze' || s.id === 'web');
}

function elementMult(attacker: Combatant, skill: SkillDef, target: Combatant): number {
  const el = skill.element;
  if (ELEMENT_ADVANTAGE[el]?.includes(target.element)) return ELEMENT_ADV_MULT;
  if (ELEMENT_ADVANTAGE[target.element]?.includes(el)) return ELEMENT_DISADV_MULT;
  void attacker;
  return 1;
}

/** Valid primary targets for a skill from the perspective of the actor */
export function validTargets(state: BattleState, actor: Combatant, skill: SkillDef): Combatant[] {
  const enemies = enemiesOf(state, actor);
  const allies = alliesOf(state, actor);
  switch (skill.target) {
    case 'enemy':
    case 'chain': {
      const taunters = enemies.filter((e) => hasStatus(e, 'taunt'));
      if (taunters.length) return taunters;
      const visible = enemies.filter((e) => !hasStatus(e, 'stealth'));
      return visible.length ? visible : enemies;
    }
    case 'enemies':
    case 'randomEnemies':
    case 'weakestEnemy':
      return enemies;
    case 'ally':
    case 'allies':
    case 'lowestAlly':
      return allies;
    case 'self':
      return [actor];
    case 'deadAlly':
      return state.combatants.filter((x) => x.side === actor.side && !x.alive);
  }
}

function lowestHpPct(list: Combatant[]): Combatant | undefined {
  return [...list].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

function resolvePrimaryTargets(
  state: BattleState,
  actor: Combatant,
  skill: SkillDef,
  chosen: Combatant | undefined,
  rng: Rng,
): Combatant[] {
  const valid = validTargets(state, actor, skill);
  if (!valid.length) return [];
  switch (skill.target) {
    case 'enemy':
      return [chosen && valid.includes(chosen) ? chosen : rng.pick(valid)];
    case 'chain': {
      const first = chosen && valid.includes(chosen) ? chosen : rng.pick(valid);
      const others = rng.shuffle(enemiesOf(state, actor).filter((e) => e.uid !== first.uid));
      return [first, ...others.slice(0, skill.chainJumps ?? 2)];
    }
    case 'enemies':
    case 'allies':
      return valid;
    case 'randomEnemies': {
      const n = skill.count ?? 3;
      const out: Combatant[] = [];
      const pool = rng.shuffle(valid);
      for (let i = 0; i < n; i++) out.push(pool[i % pool.length]);
      return out;
    }
    case 'weakestEnemy':
      return [lowestHpPct(valid)!];
    case 'ally':
    case 'lowestAlly':
      return [chosen && valid.includes(chosen) ? chosen : lowestHpPct(valid)!];
    case 'self':
      return [actor];
    case 'deadAlly':
      return [chosen && valid.includes(chosen) ? chosen : rng.pick(valid)];
  }
}

function resolveEffectTargets(
  state: BattleState,
  actor: Combatant,
  primary: Combatant[],
  target: EffectTarget,
): Combatant[] {
  switch (target) {
    case 'target':
      return primary;
    case 'self':
      return [actor];
    case 'allies':
      return alliesOf(state, actor);
    case 'ally': {
      const allies = alliesOf(state, actor);
      const low = lowestHpPct(allies);
      return low ? [low] : [];
    }
    case 'enemies':
      return enemiesOf(state, actor);
  }
}

// ───────────────────────── Status application ─────────────────────────

function applyStatus(
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  id: StatusId,
  turns: number,
  value: number,
  events: BattleEvent[],
  rng: Rng,
  chance = 1,
  selfTurn = false,
): void {
  if (!target.alive) return;
  const isDebuff = DEBUFFS.includes(id);
  if (isDebuff) {
    if (CC_STATUSES.includes(id) || id === 'web') {
      if (hasStatus(target, 'ccImmune') || hasStatus(target, 'dragonForm')) {
        events.push({ type: 'miss', targetId: target.uid, text: 'immune' });
        return;
      }
    }
    const imm = getStatus(target, 'debuffImmune');
    if (imm) {
      target.statuses = target.statuses.filter((s) => s !== imm);
      events.push({ type: 'miss', targetId: target.uid, text: 'immune' });
      return;
    }
    if (!rng.chance(chance)) {
      events.push({ type: 'miss', targetId: target.uid, text: 'resist' });
      return;
    }
  }
  const finalTurns = selfTurn && target.uid === actor.uid && !isDebuff ? turns + 1 : turns;
  const existing = getStatus(target, id);
  if (id === 'rage' && existing) {
    existing.value = Math.min(existing.value + value, value * 5);
    existing.turns = Math.max(existing.turns, finalTurns);
  } else if (existing && id !== 'shield') {
    existing.turns = Math.max(existing.turns, finalTurns);
    existing.value = Math.max(existing.value, value);
  } else if (existing && id === 'shield') {
    existing.value += value;
    existing.turns = Math.max(existing.turns, finalTurns);
  } else {
    target.statuses.push({ id, turns: finalTurns, value, sourceId: actor.uid });
  }
  events.push({ type: 'status', actorId: actor.uid, targetId: target.uid, status: id, value });
  void state;
}

// ───────────────────────── Damage ─────────────────────────

interface DamageOpts {
  skill: SkillDef;
  effect: Extract<Effect, { kind: 'damage' }>;
  levelMult: number;
}

function dealDamage(
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  opts: DamageOpts,
  events: BattleEvent[],
  rng: Rng,
): number {
  if (!target.alive) return 0;
  const { skill, effect } = opts;
  const magic = skill.element !== 'physical';

  // Evasion
  const eva = statusValue(target, 'evasion');
  if (eva > 0 && rng.chance(eva / 100)) {
    events.push({ type: 'miss', actorId: actor.uid, targetId: target.uid, text: 'dodge' });
    return 0;
  }

  // Immunities
  if (skill.element === 'fire' && target.tags.includes('fireImmune')) {
    events.push({ type: 'miss', actorId: actor.uid, targetId: target.uid, text: 'immune' });
    return 0;
  }

  let mult = effect.mult * opts.levelMult;
  if (effect.bonusVsTags && effect.bonusVsTags.tags.some((t) => target.tags.includes(t))) {
    mult *= effect.bonusVsTags.mult;
  }
  if (effect.missingHpBonus) {
    mult *= 1 + effect.missingHpBonus * (1 - actor.hp / actor.maxHp);
  }
  if (effect.perDebuffBonus) {
    const debuffs = enemiesOf(state, actor).reduce(
      (n, e) => n + e.statuses.filter((s) => DEBUFFS.includes(s.id)).length,
      0,
    );
    mult *= 1 + effect.perDebuffBonus * debuffs;
  }
  // Stealth bonus (consumed)
  const stealth = getStatus(actor, 'stealth');
  if (stealth) {
    mult *= 1 + stealth.value / 100;
    actor.statuses = actor.statuses.filter((s) => s !== stealth);
  }

  let armorPen = effect.armorPen ?? 0;
  if (target.tags.includes('ironskin') && magic) armorPen = Math.max(armorPen, 0.5);

  const atk = effectiveAtk(actor, magic);
  const def = effectiveDef(target) * (1 - armorPen);
  const k = armorConstant(actor.level);
  let dmg = atk * mult * (k / (k + def * 4));

  dmg *= elementMult(actor, skill, target);
  if (!magic && target.tags.includes('physResist')) dmg *= 0.5;

  // Crit
  let crit = false;
  const critChance = actor.base.crit + (effect.bonusCrit ?? 0);
  if ((effect.critIfDebuffed && isDebuffed(target)) || rng.chance(critChance / 100)) {
    crit = true;
    dmg *= actor.base.critDmg / 100;
  }

  // Variance
  dmg *= 0.92 + rng.next() * 0.16;
  dmg = Math.max(1, Math.round(dmg));

  const dealt = applyDamage(state, target, dmg, actor, events, rng, skill.element);
  events.push({
    type: 'damage',
    actorId: actor.uid,
    targetId: target.uid,
    value: dealt,
    crit,
    skillId: skill.id,
  });

  // Splitter: stone knoll splits on crit
  if (crit && target.alive && target.tags.includes('splitter')) {
    target.tags = target.tags.filter((t) => t !== 'splitter');
    summon(state, target, 'stone_knoll_small', 2, 4, events);
  }

  // Reflect
  const reflect = statusValue(target, 'reflect');
  if (reflect > 0 && actor.alive) {
    const back = Math.round(dealt * (reflect / 100));
    if (back > 0) {
      applyDamage(state, actor, back, target, events, rng, 'physical', true);
      events.push({
        type: 'damage',
        actorId: target.uid,
        targetId: actor.uid,
        value: back,
        text: 'reflect',
      });
    }
  }

  // Lifesteal
  const ls = statusValue(actor, 'lifesteal');
  if (ls > 0 && actor.alive && dealt > 0) {
    healUnit(actor, Math.round(dealt * (ls / 100)), actor, events);
  }
  return dealt;
}

/** Applies raw damage with shields, soul link and death handling. Returns HP actually lost. */
function applyDamage(
  state: BattleState,
  target: Combatant,
  amount: number,
  source: Combatant | null,
  events: BattleEvent[],
  rng: Rng,
  element: string,
  noLink = false,
): number {
  if (!target.alive || amount <= 0) return 0;
  let remaining = amount;

  // Shields absorb
  for (const s of target.statuses) {
    if (s.id !== 'shield' || remaining <= 0) continue;
    const absorbed = Math.min(s.value, remaining);
    s.value -= absorbed;
    remaining -= absorbed;
    if (absorbed > 0) events.push({ type: 'shield', targetId: target.uid, value: -absorbed });
  }
  target.statuses = target.statuses.filter((s) => !(s.id === 'shield' && s.value <= 0));

  // Soul link splits damage
  if (!noLink) {
    const link = getStatus(target, 'soulLink');
    if (link?.linkedTo) {
      const partner = state.combatants.find((c) => c.uid === link.linkedTo);
      if (partner?.alive && partner.uid !== target.uid) {
        const shared = Math.floor(remaining / 2);
        remaining -= shared;
        const lost = applyDamage(state, partner, shared, source, events, rng, element, true);
        if (lost > 0)
          events.push({ type: 'damage', targetId: partner.uid, value: lost, text: 'link' });
      }
    }
  }

  const before = target.hp;
  target.hp = Math.max(0, target.hp - remaining);
  if (target.hp <= 0) {
    handleDeath(state, target, element, events);
  }
  return before - target.hp;
}

function handleDeath(
  state: BattleState,
  target: Combatant,
  element: string,
  events: BattleEvent[],
): void {
  const revive = getStatus(target, 'reviveOnce');
  if (revive && element !== 'fire') {
    target.statuses = target.statuses.filter((s) => s !== revive);
    target.hp = Math.max(1, Math.round(target.maxHp * (revive.value / 100)));
    events.push({ type: 'revive', targetId: target.uid, value: target.hp });
    return;
  }
  target.alive = false;
  target.hp = 0;
  target.statuses = [];
  target.gauge = 0;
  // Break soul links pointing at this unit
  for (const c of state.combatants) {
    for (const s of c.statuses)
      if (s.id === 'soulLink' && s.linkedTo === target.uid) s.linkedTo = undefined;
  }
  events.push({ type: 'death', targetId: target.uid });
}

function healUnit(
  target: Combatant,
  amount: number,
  source: Combatant,
  events: BattleEvent[],
): number {
  if (!target.alive || amount <= 0) return 0;
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  const healed = target.hp - before;
  if (healed > 0)
    events.push({ type: 'heal', actorId: source.uid, targetId: target.uid, value: healed });
  return healed;
}

function summon(
  state: BattleState,
  summoner: Combatant,
  monsterId: string,
  count: number,
  maxAlive: number,
  events: BattleEvent[],
): void {
  const def = getMonsterDef(monsterId);
  const alive = state.combatants.filter(
    (c) => c.side === summoner.side && c.defId === monsterId && c.alive,
  ).length;
  const sideCount = state.combatants.filter((c) => c.side === summoner.side && c.alive).length;
  const allowed = Math.min(count, maxAlive - alive, 6 - sideCount);
  for (let i = 0; i < allowed; i++) {
    const existing = state.combatants.filter((c) => c.defId === monsterId).length;
    const c = createMonsterCombatant(def, summoner.level, 0.8, def.id, `s${existing + i}`);
    c.side = summoner.side;
    c.summoned = true;
    c.uid = `${summoner.side === 'enemy' ? 'e' : 'h'}_${def.id}_s${existing + i}_${state.turnCount}`;
    state.combatants.push(c);
    events.push({ type: 'summon', actorId: summoner.uid, targetId: c.uid });
  }
}

// ───────────────────────── Turn flow ─────────────────────────

function checkResult(state: BattleState): void {
  const heroesAlive = state.combatants.some((c) => c.side === 'hero' && c.alive);
  const enemiesAlive = state.combatants.some((c) => c.side === 'enemy' && c.alive);
  if (!enemiesAlive) state.result = 'victory';
  else if (!heroesAlive) state.result = 'defeat';
  else if (state.turnCount >= MAX_TURNS) state.result = 'defeat';
}

/**
 * Advances the gauge until a unit is ready. Handles start-of-turn ticks (DoT, regen)
 * and skipped turns (stun/freeze/web/charm). Returns state with activeId set when a
 * unit needs a decision, or result != ongoing.
 */
export function advance(input: BattleState): BattleState {
  const state = clone(input);
  if (state.result !== 'ongoing') return state;

  for (let guard = 0; guard < 500; guard++) {
    const alive = state.combatants.filter((c) => c.alive);
    let ready = alive.filter((c) => c.gauge >= GAUGE_MAX);
    while (!ready.length) {
      for (const c of alive) c.gauge += effectiveSpd(c);
      ready = alive.filter((c) => c.gauge >= GAUGE_MAX);
    }
    ready.sort((a, b) => b.gauge - a.gauge || effectiveSpd(b) - effectiveSpd(a));
    const actor = ready[0];
    actor.gauge -= GAUGE_MAX;
    state.turnCount += 1;
    state.round = Math.floor(state.turnCount / Math.max(1, alive.length)) + 1;

    const events: BattleEvent[] = [{ type: 'turn', actorId: actor.uid }];
    const rng = rngFor(state);

    // Cooldowns tick at start of own turn
    for (const k of Object.keys(actor.cooldowns)) {
      if (actor.cooldowns[k] > 0) actor.cooldowns[k] -= 1;
    }

    // DoTs and regen
    for (const s of actor.statuses) {
      if (s.id === 'poison' || s.id === 'bleed' || s.id === 'burn') {
        const src = s.sourceId ? state.combatants.find((c) => c.uid === s.sourceId) : undefined;
        const base = src ? src.base.atk : actor.maxHp * 0.02;
        const dmg = Math.max(1, Math.round(base * s.value));
        const lost = applyDamage(
          state,
          actor,
          dmg,
          src ?? null,
          events,
          rng,
          s.id === 'burn' ? 'fire' : 'poison',
        );
        events.push({ type: 'damage', targetId: actor.uid, value: lost, status: s.id });
        if (!actor.alive) break;
      }
      if (s.id === 'regen') {
        healUnit(actor, Math.round(actor.maxHp * (s.value / 100)), actor, events);
      }
    }
    state.log.push(...events);
    checkResult(state);
    if (state.result !== 'ongoing') return state;

    if (!actor.alive) {
      continue;
    }

    // Crowd control – skip
    if (isCrowdControlled(actor)) {
      const cc = actor.statuses.find(
        (s) => s.id === 'stun' || s.id === 'freeze' || s.id === 'web',
      )!;
      state.log.push({ type: 'info', actorId: actor.uid, text: 'skipped', status: cc.id });
      endTurn(state, actor);
      checkResult(state);
      if (state.result !== 'ongoing') return state;
      continue;
    }

    // Charm – attack own ally with basic
    if (hasStatus(actor, 'charm')) {
      const allies = alliesOf(state, actor).filter((a) => a.uid !== actor.uid);
      const basic = actor.skills.find((s) => s.kind === 'basic') ?? actor.skills[0];
      state.log.push({ type: 'info', actorId: actor.uid, text: 'charmed', status: 'charm' });
      if (allies.length && basic) {
        const target = rng.pick(allies);
        const ev: BattleEvent[] = [
          { type: 'skill', actorId: actor.uid, skillId: basic.id, targetId: target.uid },
        ];
        const dmgEffect = basic.effects.find((e) => e.kind === 'damage') as
          Extract<Effect, { kind: 'damage' }> | undefined;
        if (dmgEffect)
          dealDamage(
            state,
            actor,
            target,
            { skill: basic, effect: dmgEffect, levelMult: 1 },
            ev,
            rng,
          );
        state.log.push(...ev);
      }
      endTurn(state, actor);
      checkResult(state);
      if (state.result !== 'ongoing') return state;
      continue;
    }

    state.activeId = actor.uid;
    return state;
  }
  return state;
}

function endTurn(state: BattleState, actor: Combatant): void {
  // Decrement statuses (stealth only expires after 2 of own turns via its own counter)
  for (const s of actor.statuses) {
    if (s.turns < 999) s.turns -= 1;
  }
  const expired = actor.statuses.filter((s) => s.turns <= 0);
  for (const s of expired)
    state.log.push({ type: 'status', targetId: actor.uid, status: s.id, text: 'expired' });
  actor.statuses = actor.statuses.filter((s) => s.turns > 0);

  // Haste: act again immediately
  const haste = getStatus(actor, 'haste');
  if (haste) {
    actor.statuses = actor.statuses.filter((s) => s !== haste);
    actor.gauge = GAUGE_MAX;
  }
  state.activeId = null;
}

// ───────────────────────── Actions ─────────────────────────

export function canUseSkill(state: BattleState, actor: Combatant, skill: SkillDef): boolean {
  if ((actor.cooldowns[skill.id] ?? 0) > 0) return false;
  if (skill.target === 'deadAlly') return validTargets(state, actor, skill).length > 0;
  for (const e of skill.effects) {
    if (e.kind === 'summon') {
      const alive = state.combatants.filter(
        (c) => c.side === actor.side && c.defId === e.monsterId && c.alive,
      ).length;
      const sideCount = state.combatants.filter((c) => c.side === actor.side && c.alive).length;
      if (alive >= (e.maxAlive ?? 99) || sideCount >= 6) return false;
    }
  }
  return true;
}

export function performAction(
  input: BattleState,
  skillId: string,
  targetUid?: string,
): BattleState {
  const state = clone(input);
  if (state.result !== 'ongoing' || !state.activeId) return state;
  const actor = find(state, state.activeId);
  const skill = actor.skills.find((s) => s.id === skillId);
  if (!skill || !canUseSkill(state, actor, skill)) return state;
  const rng = rngFor(state);
  const events: BattleEvent[] = [];
  const chosen = targetUid ? state.combatants.find((c) => c.uid === targetUid) : undefined;
  const primary = resolvePrimaryTargets(state, actor, skill, chosen, rng);
  const levelMult = skillLevelMult(actor.skillLevels[skill.id] ?? 1);

  events.push({ type: 'skill', actorId: actor.uid, skillId: skill.id, targetId: primary[0]?.uid });
  if (skill.cooldown > 0) actor.cooldowns[skill.id] = skill.cooldown;

  for (const effect of skill.effects) {
    switch (effect.kind) {
      case 'damage': {
        for (const t of primary) {
          for (let h = 0; h < (effect.hits ?? 1); h++) {
            if (!actor.alive) break;
            dealDamage(state, actor, t, { skill, effect, levelMult }, events, rng);
          }
        }
        break;
      }
      case 'heal': {
        for (const t of resolveEffectTargets(state, actor, primary, effect.target)) {
          healUnit(
            t,
            Math.round(effectiveAtk(actor, true) * effect.mult * levelMult),
            actor,
            events,
          );
        }
        break;
      }
      case 'shield': {
        for (const t of resolveEffectTargets(state, actor, primary, effect.target)) {
          const value = Math.round(effectiveAtk(actor, true) * effect.mult * levelMult);
          applyStatus(state, actor, t, 'shield', effect.turns, value, events, rng, 1, true);
        }
        break;
      }
      case 'status': {
        const targets = resolveEffectTargets(state, actor, primary, effect.target);
        if (effect.status === 'soulLink') {
          const pair = [...targets].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, 2);
          if (pair.length === 2) {
            for (const [i, t] of pair.entries()) {
              t.statuses = t.statuses.filter((s) => s.id !== 'soulLink');
              t.statuses.push({
                id: 'soulLink',
                turns: effect.turns,
                value: 50,
                sourceId: actor.uid,
                linkedTo: pair[1 - i].uid,
              });
              events.push({
                type: 'status',
                actorId: actor.uid,
                targetId: t.uid,
                status: 'soulLink',
              });
            }
          }
          break;
        }
        for (const t of targets) {
          const value = effect.value ?? 0;
          applyStatus(
            state,
            actor,
            t,
            effect.status,
            effect.turns,
            value,
            events,
            rng,
            effect.chance ?? 1,
            true,
          );
        }
        break;
      }
      case 'cleanse': {
        for (const t of resolveEffectTargets(state, actor, primary, effect.target)) {
          let n = effect.count;
          t.statuses = t.statuses.filter((s) => {
            if (n > 0 && DEBUFFS.includes(s.id)) {
              n -= 1;
              events.push({ type: 'status', targetId: t.uid, status: s.id, text: 'cleansed' });
              return false;
            }
            return true;
          });
        }
        break;
      }
      case 'summon':
        summon(state, actor, effect.monsterId, effect.count, effect.maxAlive ?? 99, events);
        break;
      case 'selfDamage': {
        const dmg = Math.round(actor.maxHp * (effect.percentMaxHp / 100));
        actor.hp = Math.max(1, actor.hp - dmg);
        events.push({ type: 'damage', targetId: actor.uid, value: dmg, text: 'sacrifice' });
        break;
      }
      case 'revive': {
        for (const t of primary) {
          if (t.alive) continue;
          t.alive = true;
          t.hp = Math.max(1, Math.round(t.maxHp * (effect.hpPercent / 100)));
          t.gauge = 0;
          events.push({ type: 'revive', actorId: actor.uid, targetId: t.uid, value: t.hp });
        }
        break;
      }
      case 'drain': {
        const dealt = events
          .filter((e) => e.type === 'damage' && e.actorId === actor.uid && e.skillId === skill.id)
          .reduce((a, e) => a + (e.value ?? 0), 0);
        if (dealt > 0) healUnit(actor, Math.round(dealt * effect.mult), actor, events);
        break;
      }
    }
  }

  state.log.push(...events);
  endTurn(state, actor);
  checkResult(state);
  return state;
}

// ───────────────────────── AI ─────────────────────────

export function chooseAction(
  state: BattleState,
  actorId: string,
): { skillId: string; targetUid?: string } {
  const actor = find(state, actorId);
  const rng = rngFor(state);
  const allies = alliesOf(state, actor);
  const enemies = enemiesOf(state, actor);
  const usable = actor.skills.filter((s) => canUseSkill(state, actor, s));

  const isHealSkill = (s: SkillDef) =>
    s.effects.some((e) => e.kind === 'heal' || e.kind === 'shield' || e.kind === 'cleanse');
  const needsHeal = allies.some((a) => a.hp / a.maxHp < 0.7);
  const needsCleanse = allies.some((a) => isDebuffed(a));

  const scored = usable.map((s) => {
    let score = s.kind === 'ultimate' ? 100 : s.kind === 'skill' ? 60 : 10;
    const onlyHeal = s.effects.every(
      (e) =>
        e.kind === 'heal' || e.kind === 'shield' || e.kind === 'cleanse' || e.kind === 'status',
    );
    if (
      isHealSkill(s) &&
      onlyHeal &&
      !needsHeal &&
      !(s.effects.some((e) => e.kind === 'cleanse') && needsCleanse)
    )
      score -= 80;
    if (
      s.effects.some((e) => e.kind === 'status' && e.target === 'self' && e.status !== 'shield') &&
      s.effects.every((e) => e.kind === 'status')
    ) {
      // pure self buff – less valuable if already buffed
      if (s.effects.some((e) => e.kind === 'status' && hasStatus(actor, e.status))) score -= 70;
    }
    if (s.target === 'enemies' && enemies.length >= 2) score += 20;
    score += rng.next() * 15;
    return { s, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const skill = scored[0]?.s ?? actor.skills[0];

  let targetUid: string | undefined;
  const valid = validTargets(state, actor, skill);
  if (skill.target === 'enemy' || skill.target === 'chain') {
    // Prefer low HP targets
    const sorted = [...valid].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    targetUid = (rng.chance(0.6) ? sorted[0] : rng.pick(valid))?.uid;
  } else if (skill.target === 'ally' || skill.target === 'lowestAlly') {
    targetUid = lowestHpPct(valid)?.uid;
  } else if (skill.target === 'deadAlly') {
    targetUid = valid[0]?.uid;
  }
  return { skillId: skill.id, targetUid };
}

export function battleStars(state: BattleState): number {
  const heroes = state.combatants.filter((c) => c.side === 'hero');
  const dead = heroes.filter((h) => !h.alive).length;
  if (state.result !== 'victory') return 0;
  return dead === 0 ? 3 : dead === 1 ? 2 : 1;
}
