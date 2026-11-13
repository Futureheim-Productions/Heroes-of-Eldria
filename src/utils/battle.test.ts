import { describe, expect, it } from 'vitest';
import {
  advance,
  chooseAction,
  createBattle,
  createHeroCombatant,
  createMonsterCombatant,
  performAction,
  battleStars,
} from './battle';
import { heroBaseStats, heroFullStats, powerRating } from './stats';
import { getHeroDef, HEROES } from '@/data/heroes';
import { getMonsterDef, MONSTERS } from '@/data/monsters';
import { REGIONS } from '@/data/dungeons';
import type { BattleState, OwnedHero } from '@/types';

function owned(id: string, level = 10): OwnedHero {
  const def = getHeroDef(id);
  return { defId: id, level, xp: 0, stars: def.baseStars, skillLevels: {}, equipment: {} };
}

function hero(id: string, level = 10) {
  const def = getHeroDef(id);
  const o = owned(id, level);
  return createHeroCombatant(def, o, heroFullStats(def, o, []), id);
}

function monster(id: string, level = 5, suffix = '0') {
  return createMonsterCombatant(getMonsterDef(id), level, 1, id, suffix);
}

function runAuto(state: BattleState, maxTurns = 400): BattleState {
  let s = state;
  let guard = 0;
  while (s.result === 'ongoing' && guard++ < maxTurns) {
    s = advance(s);
    if (s.result !== 'ongoing' || !s.activeId) continue;
    const { skillId, targetUid } = chooseAction(s, s.activeId);
    s = performAction(s, skillId, targetUid);
  }
  return s;
}

describe('stats', () => {
  it('grows with level and stars', () => {
    const def = getHeroDef('arthen');
    const l1 = heroBaseStats(def, 1, 3);
    const l20 = heroBaseStats(def, 20, 3);
    const l20s5 = heroBaseStats(def, 20, 5);
    expect(l20.hp).toBeGreaterThan(l1.hp);
    expect(l20s5.atk).toBeGreaterThan(l20.atk);
    expect(powerRating(l20s5)).toBeGreaterThan(powerRating(l1));
  });
});

describe('battle engine', () => {
  it('runs a deterministic battle to completion', () => {
    const heroes = ['arthen', 'lyra', 'thora'].map((h) => hero(h, 12));
    const enemies = [monster('shadow_wolf', 3, '0'), monster('shadow_wolf', 3, '1')];
    const a = runAuto(createBattle('b1', heroes, enemies, 42));
    const b = runAuto(
      createBattle(
        'b1',
        ['arthen', 'lyra', 'thora'].map((h) => hero(h, 12)),
        [monster('shadow_wolf', 3, '0'), monster('shadow_wolf', 3, '1')],
        42,
      ),
    );
    expect(a.result).toBe('victory');
    expect(a.log.length).toBe(b.log.length);
    expect(battleStars(a)).toBeGreaterThanOrEqual(1);
  });

  it('applies cooldowns and status effects', () => {
    let s = createBattle('b2', [hero('lyra', 10)], [monster('stone_knoll', 1)], 7);
    s = advance(s);
    // Lyra is faster – she acts first
    expect(s.activeId).toBe('h_lyra');
    s = performAction(s, 'lyra_ice_prison', 'e_stone_knoll_0');
    const lyra = s.combatants.find((c) => c.uid === 'h_lyra')!;
    const knoll = s.combatants.find((c) => c.uid === 'e_stone_knoll_0')!;
    expect(lyra.cooldowns['lyra_ice_prison']).toBe(4);
    expect(knoll.hp).toBeLessThan(knoll.maxHp);
    expect(knoll.statuses.some((st) => st.id === 'freeze')).toBe(true);
    // Frozen knoll skips its turn
    s = advance(s);
    expect(s.log.some((e) => e.type === 'info' && e.text === 'skipped')).toBe(true);
  });

  it('skeleton revives once unless burned', () => {
    let s = createBattle('b3', [hero('kael', 40)], [monster('skeleton_warrior', 1)], 3);
    s = advance(s);
    s = performAction(s, 'kael_dragon_form', 'e_skeleton_warrior_0');
    const sk = s.combatants.find((c) => c.uid === 'e_skeleton_warrior_0')!;
    // Dragon form deals fire damage – no revive
    expect(sk.alive).toBe(false);
    expect(s.result).toBe('victory');

    let s2 = createBattle('b4', [hero('lyra', 60)], [monster('skeleton_warrior', 1)], 3);
    s2 = advance(s2);
    s2 = performAction(s2, 'lyra_chain_lightning', 'e_skeleton_warrior_0');
    const sk2 = s2.combatants.find((c) => c.uid === 'e_skeleton_warrior_0')!;
    expect(sk2.alive).toBe(true);
    expect(s2.log.some((e) => e.type === 'revive')).toBe(true);
  });

  it('summons respect maxAlive', () => {
    let s = createBattle('b5', [hero('arthen', 1)], [monster('mushroom_farmer', 5)], 11);
    for (let i = 0; i < 12 && s.result === 'ongoing'; i++) {
      s = advance(s);
      if (!s.activeId) continue;
      const actor = s.combatants.find((c) => c.uid === s.activeId)!;
      if (actor.side === 'enemy') s = performAction(s, 'spawn_mushrooms');
      else s = performAction(s, 'arthen_holy_strike', 'e_mushroom_farmer_0');
    }
    const minions = s.combatants.filter((c) => c.defId === 'mushroom_minion' && c.alive).length;
    expect(minions).toBeLessThanOrEqual(2);
  });

  it('every hero and monster skill can be executed without throwing', () => {
    for (const h of HEROES) {
      let s = createBattle(
        'h_' + h.id,
        [hero(h.id, 20), hero(h.id === 'arthen' ? 'lyra' : 'arthen', 20)],
        [monster('shadow_wolf', 5, '0'), monster('skeleton_warrior', 5, '1')],
        1,
      );
      for (const skill of h.skills) {
        s = advance(s);
        while (s.result === 'ongoing' && s.activeId !== `h_${h.id}`) {
          const { skillId, targetUid } = chooseAction(s, s.activeId!);
          s = performAction(s, skillId, targetUid);
          s = advance(s);
        }
        if (s.result !== 'ongoing') break;
        const c = s.combatants.find((x) => x.uid === `h_${h.id}`)!;
        c.cooldowns = {};
        expect(() => (s = performAction(s, skill.id))).not.toThrow();
      }
    }
    for (const m of MONSTERS) {
      let s = createBattle(
        'm_' + m.id,
        [hero('arthen', 30), hero('mira', 30)],
        [monster(m.id, 10, '0')],
        2,
      );
      for (const skill of m.skills) {
        s = advance(s);
        while (s.result === 'ongoing' && s.activeId !== `e_${m.id}_0`) {
          const { skillId, targetUid } = chooseAction(s, s.activeId!);
          s = performAction(s, skillId, targetUid);
          s = advance(s);
        }
        if (s.result !== 'ongoing') break;
        const c = s.combatants.find((x) => x.uid === `e_${m.id}_0`)!;
        c.cooldowns = {};
        expect(() => (s = performAction(s, skill.id))).not.toThrow();
      }
    }
  });

  it('first stage is winnable by the starter team', () => {
    const stage = REGIONS[0].stages[0];
    const heroes = ['arthen', 'lyra', 'thora'].map((h) => hero(h, 1));
    const enemies = stage.enemies.map((e, i) =>
      createMonsterCombatant(getMonsterDef(e.monsterId), e.level, 1, e.monsterId, `${i}`, e.boss),
    );
    let wins = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const s = runAuto(
        createBattle(
          's' + seed,
          heroes.map((h) => ({
            ...h,
            statuses: [],
            cooldowns: {},
            hp: h.maxHp,
            alive: true,
            gauge: 0,
          })),
          enemies.map((e) => ({
            ...e,
            statuses: [...e.statuses],
            cooldowns: {},
            hp: e.maxHp,
            alive: true,
            gauge: 0,
          })),
          seed,
        ),
      );
      if (s.result === 'victory') wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(4);
  });
});
