/**
 * Game service: cross-store logic (rewards, dungeon flow, summons, upgrades, resets).
 * All state mutations that touch more than one store go through here so it can later be
 * swapped for server calls (see Technical Architecture §4).
 */
import i18n from 'i18next';
import type {
  BattleConfig,
  BattleState,
  EquipSlot,
  OwnedHero,
  OwnedItem,
  Reward,
  ShopOffer,
  Stats,
} from '@/types';
import { getHeroDef, HEROES } from '@/data/heroes';
import { getMonsterDef } from '@/data/monsters';
import { getItemDef } from '@/data/items';
import { getStage, HARD_MULT, REGION_MAP } from '@/data/dungeons';
import { QUEST_MAP } from '@/data/quests';
import { SUMMON_RATES } from '@/data/shop';
import { generateArenaOpponents, type ArenaOpponent } from '@/data/social';
import { usePlayerStore } from '@/stores/playerStore';
import { useHeroStore } from '@/stores/heroStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useQuestStore } from '@/stores/questStore';
import { useProgressStore } from '@/stores/progressStore';
import { useCombatStore, type CombatRewardSummary } from '@/stores/combatStore';
import { useArenaStore, useGuildStore, useMailStore, useShopStore } from '@/stores/metaStores';
import { useUiStore } from '@/stores/uiStore';
import { heroFullStats, powerRating } from '@/utils/stats';
import {
  battleStars,
  createBattle,
  createHeroCombatant,
  createMonsterCombatant,
} from '@/utils/battle';
import { Rng, randomSeed, uid } from '@/utils/rng';
import { dayKey, weekKey } from '@/utils/format';
import {
  ARENA_MAX_DAILY,
  DAILY_LOGIN_REWARDS,
  enhanceCost,
  heroLevelCost,
  heroXpForLevel,
  MAX_ENHANCE,
  MAX_HERO_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_STARS,
  PITY_THRESHOLD,
  skillUpgradeCost,
  starUpShardCost,
  SUMMON_COST_SINGLE,
  SUMMON_COST_TEN,
} from '@/utils/constants';

const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts) as string;

// ───────────────────────── Rewards ─────────────────────────

export function grantReward(reward: Reward, silent = false): void {
  const player = usePlayerStore.getState();
  const heroes = useHeroStore.getState();
  const inv = useInventoryStore.getState();
  const quests = useQuestStore.getState();
  if (reward.currencies) player.addCurrency(reward.currencies);
  if (reward.items) for (const it of reward.items) inv.addItem(it.itemId, it.qty);
  if (reward.heroShards) for (const s of reward.heroShards) heroes.addShards(s.heroId, s.qty);
  if (reward.xp) {
    const r = player.addXp(reward.xp);
    if (r.leveled) {
      quests.track({ type: 'playerLevel', level: r.level });
      useUiStore.getState().toast(t('common:player_level_up', { level: r.level }), 'success');
    }
  }
  if (!silent) useUiStore.getState().toast(describeReward(reward), 'reward');
}

export function describeReward(reward: Reward): string {
  const parts: string[] = [];
  if (reward.currencies) {
    for (const [k, v] of Object.entries(reward.currencies))
      if (v) parts.push(`+${v} ${t(`common:${k}`)}`);
  }
  if (reward.items)
    for (const it of reward.items) parts.push(`+${it.qty} ${t(`items:${it.itemId}.name`)}`);
  if (reward.heroShards)
    for (const s of reward.heroShards)
      parts.push(`+${s.qty} ${t(`heroes:${s.heroId}.name`)} ${t('common:shards')}`);
  if (reward.xp) parts.push(`+${reward.xp} XP`);
  return parts.join('  ');
}

// ───────────────────────── Hero helpers ─────────────────────────

export function equippedItems(owned: OwnedHero): OwnedItem[] {
  const inv = useInventoryStore.getState();
  return Object.values(owned.equipment)
    .map((u) => (u ? inv.getItem(u) : undefined))
    .filter((i): i is OwnedItem => !!i);
}

export function heroStats(owned: OwnedHero): Stats {
  return heroFullStats(getHeroDef(owned.defId), owned, equippedItems(owned));
}

export function heroPower(owned: OwnedHero): number {
  return powerRating(heroStats(owned));
}

export function teamPower(): number {
  return useHeroStore
    .getState()
    .formationHeroes()
    .reduce((a, h) => a + heroPower(h), 0);
}

export function heroName(defId: string): string {
  return t(`heroes:${defId}.name`);
}

export function monsterName(defId: string): string {
  return t(`monsters:${defId}.name`);
}

// ───────────────────────── Dungeon flow ─────────────────────────

export function startDungeon(
  stageId: string,
  difficulty: 'normal' | 'hard',
): { ok: boolean; reason?: string } {
  const stage = getStage(stageId);
  const player = usePlayerStore.getState();
  const progress = useProgressStore.getState();
  const heroStore = useHeroStore.getState();
  const formation = heroStore.formationHeroes();
  if (!formation.length) return { ok: false, reason: t('dungeon:no_formation') };
  if (!progress.isStageUnlocked(stageId, difficulty))
    return { ok: false, reason: t('dungeon:locked') };
  const cost = difficulty === 'hard' ? Math.round(stage.energyCost * 1.5) : stage.energyCost;
  if (!player.spend({ energy: cost })) return { ok: false, reason: t('dungeon:no_energy') };
  useQuestStore.getState().track({ type: 'spendEnergy', amount: cost });

  const heroes = formation.map((h) =>
    createHeroCombatant(getHeroDef(h.defId), h, heroStats(h), heroName(h.defId)),
  );
  const mult = difficulty === 'hard' ? HARD_MULT.stats : 1;
  const enemies = stage.enemies.map((e, i) => {
    const def = getMonsterDef(e.monsterId);
    const level = e.level + (difficulty === 'hard' ? HARD_MULT.level : 0);
    return createMonsterCombatant(def, level, mult, monsterName(def.id), `${i}`, e.boss);
  });
  const battle = createBattle(uid('battle'), heroes, enemies, randomSeed());
  useCombatStore.getState().begin(battle, { mode: 'dungeon', stageId, difficulty });
  return { ok: true };
}

export function completeDungeon(state: BattleState, config: BattleConfig): CombatRewardSummary {
  const stage = getStage(config.stageId!);
  const difficulty = config.difficulty ?? 'normal';
  const player = usePlayerStore.getState();
  const quests = useQuestStore.getState();
  const stars = battleStars(state);
  const summary: CombatRewardSummary = {
    gold: 0,
    xp: 0,
    gems: 0,
    keys: 0,
    arenaCoins: 0,
    items: [],
    heroXp: 0,
    stars,
    firstClear: false,
    playerLeveled: false,
  };

  if (state.result !== 'victory') {
    player.bumpStat('battlesLost');
    return summary;
  }

  const rewardMult = difficulty === 'hard' ? HARD_MULT.rewards : 1;
  const rng = new Rng(state.seed + 12345);
  summary.gold = Math.round((stage.rewards.currencies?.gold ?? 0) * rewardMult);
  summary.xp = Math.round((stage.rewards.xp ?? 0) * rewardMult);
  for (const d of stage.drops) {
    if (rng.chance(d.chance * (difficulty === 'hard' ? 1.3 : 1)))
      summary.items.push({ itemId: d.itemId, qty: d.qty ?? 1 });
  }
  const { firstClear } = useProgressStore.getState().recordClear(stage.id, difficulty, stars);
  summary.firstClear = firstClear;
  if (firstClear && stage.firstClearBonus?.currencies) {
    summary.gems = stage.firstClearBonus.currencies.gems ?? 0;
    summary.keys = stage.firstClearBonus.currencies.keys ?? 0;
  }

  const before = player.profile.level;
  grantReward(
    {
      currencies: { gold: summary.gold, gems: summary.gems, keys: summary.keys },
      items: summary.items,
      xp: summary.xp,
    },
    true,
  );
  summary.playerLeveled = usePlayerStore.getState().profile.level > before;

  // Hero XP to every hero in the formation
  summary.heroXp = Math.round(summary.xp * 1.6);
  const heroStore = useHeroStore.getState();
  for (const h of heroStore.formationHeroes()) {
    const r = heroStore.addHeroXp(h.defId, summary.heroXp);
    if (r.levels > 0) {
      const lv = useHeroStore.getState().heroes[h.defId].level;
      quests.track({ type: 'heroLevel', level: lv });
    }
  }

  player.bumpStat('battlesWon');
  quests.track({ type: 'winBattle' });
  quests.track({ type: 'clearStage', stageId: stage.id });
  return summary;
}

// ───────────────────────── Arena ─────────────────────────

export function arenaOpponents(): ArenaOpponent[] {
  const arena = useArenaStore.getState();
  return generateArenaOpponents(arena.rank, Math.max(1500, teamPower()), arena.seed);
}

export function startArena(opp: ArenaOpponent): { ok: boolean; reason?: string } {
  const arena = useArenaStore.getState();
  if (arena.dailyBattles >= ARENA_MAX_DAILY) return { ok: false, reason: t('pvp:no_attempts') };
  const formation = useHeroStore.getState().formationHeroes();
  if (!formation.length) return { ok: false, reason: t('dungeon:no_formation') };
  const heroes = formation.map((h) =>
    createHeroCombatant(getHeroDef(h.defId), h, heroStats(h), heroName(h.defId)),
  );

  // Opponent heroes are simulated as owned heroes at the opponent level
  const enemies = opp.heroIds.map((id, i) => {
    const def = getHeroDef(id);
    const fake: OwnedHero = {
      defId: id,
      level: Math.min(MAX_HERO_LEVEL, Math.max(1, opp.level)),
      xp: 0,
      stars: Math.min(MAX_STARS, def.baseStars + Math.floor(opp.level / 15)),
      skillLevels: {},
      equipment: {},
    };
    const stats = heroFullStats(def, fake, []);
    const c = createHeroCombatant(def, fake, stats, heroName(id));
    c.uid = `e_${id}_${i}`;
    c.side = 'enemy';
    return c;
  });
  const battle = createBattle(uid('arena'), heroes, enemies, randomSeed());
  useCombatStore.getState().begin(battle, { mode: 'arena', opponentId: opp.id });
  return { ok: true };
}

export function completeArena(
  state: BattleState,
  opp: ArenaOpponent | undefined,
): CombatRewardSummary {
  const won = state.result === 'victory';
  const arena = useArenaStore.getState();
  const delta = won
    ? 25 + Math.max(0, Math.floor((opp?.rank ?? arena.rank) < arena.rank ? 15 : 0))
    : -10;
  arena.applyResult(opp?.name ?? '?', won, delta);
  const player = usePlayerStore.getState();
  const summary: CombatRewardSummary = {
    gold: won ? 800 : 200,
    xp: won ? 60 : 15,
    gems: 0,
    keys: 0,
    arenaCoins: won ? 30 : 8,
    items: [],
    heroXp: 0,
    stars: won ? 3 : 0,
    firstClear: false,
    playerLeveled: false,
    rankDelta: delta,
  };
  grantReward(
    { currencies: { gold: summary.gold, arenaCoins: summary.arenaCoins }, xp: summary.xp },
    true,
  );
  if (won) {
    player.bumpStat('battlesWon');
    player.bumpStat('arenaWins');
    useQuestStore.getState().track({ type: 'winBattle' });
  } else player.bumpStat('battlesLost');
  useQuestStore.getState().track({ type: 'arenaBattle' });
  return summary;
}

// ───────────────────────── Summons (gacha) ─────────────────────────

export function summon(count: 1 | 10): {
  ok: boolean;
  results?: { heroId: string; isNew: boolean }[];
  reason?: string;
} {
  const cost = count === 10 ? SUMMON_COST_TEN : SUMMON_COST_SINGLE;
  const player = usePlayerStore.getState();
  if (!player.spend({ gems: cost })) return { ok: false, reason: t('shop:not_enough_gems') };
  const shop = useShopStore.getState();
  const heroStore = useHeroStore.getState();
  const rng = new Rng(randomSeed());
  const results: { heroId: string; isNew: boolean }[] = [];
  let pity = shop.pity;
  const total = SUMMON_RATES.reduce((a, r) => a + r.weight, 0);
  for (let i = 0; i < count; i++) {
    pity += 1;
    let rarity: string;
    if (pity >= PITY_THRESHOLD) {
      rarity = 'legendary';
      pity = 0;
    } else {
      let roll = rng.next() * total;
      rarity = 'uncommon';
      for (const r of SUMMON_RATES) {
        roll -= r.weight;
        if (roll <= 0) {
          rarity = r.rarity;
          break;
        }
      }
      if (rarity === 'legendary') pity = 0;
    }
    // 10-pull guarantees at least one epic+
    if (
      count === 10 &&
      i === 9 &&
      !results.some((r) => ['epic', 'legendary'].includes(getHeroDef(r.heroId).rarity)) &&
      rarity !== 'legendary'
    ) {
      rarity = 'epic';
    }
    const pool = HEROES.filter((h) => h.rarity === rarity);
    const hero = rng.pick(pool.length ? pool : HEROES);
    const res = heroStore.addHero(hero.id);
    results.push({ heroId: hero.id, isNew: res === 'new' });
  }
  shop.setPity(pity);
  shop.setSummonResults(results.map((r) => r.heroId));
  player.bumpStat('summons', count);
  const quests = useQuestStore.getState();
  quests.track({ type: 'summon', count });
  quests.track({ type: 'ownHeroes', count: Object.keys(useHeroStore.getState().heroes).length });
  return { ok: true, results };
}

// ───────────────────────── Hero upgrades ─────────────────────────

export function levelHeroWithGold(defId: string): boolean {
  const heroStore = useHeroStore.getState();
  const h = heroStore.heroes[defId];
  if (!h || h.level >= MAX_HERO_LEVEL) return false;
  const cost = heroLevelCost(h.level);
  if (!usePlayerStore.getState().spend({ gold: cost })) {
    useUiStore.getState().toast(t('common:not_enough_gold'), 'error');
    return false;
  }
  heroStore.addHeroXp(defId, heroXpForLevel(h.level) - h.xp);
  useQuestStore
    .getState()
    .track({ type: 'heroLevel', level: useHeroStore.getState().heroes[defId].level });
  return true;
}

export function applyXpPotion(defId: string, itemDefId: string): boolean {
  const inv = useInventoryStore.getState();
  const def = getItemDef(itemDefId);
  if (def.material !== 'xpPotion' || !inv.removeItem(itemDefId, 1)) return false;
  const heroStore = useHeroStore.getState();
  const r = heroStore.addHeroXp(defId, def.value ?? 0);
  if (r.levels)
    useQuestStore
      .getState()
      .track({ type: 'heroLevel', level: useHeroStore.getState().heroes[defId].level });
  return true;
}

export function starUpCost(h: OwnedHero): { shards: number; crystals: number; gold: number } {
  return {
    shards: starUpShardCost(h.stars),
    crystals: h.stars >= 4 ? (h.stars - 3) * 2 : 0,
    gold: h.stars * 2000,
  };
}

export function starUpHero(defId: string): boolean {
  const heroStore = useHeroStore.getState();
  const h = heroStore.heroes[defId];
  if (!h || h.stars >= MAX_STARS) return false;
  const cost = starUpCost(h);
  const inv = useInventoryStore.getState();
  if ((heroStore.shards[defId] ?? 0) < cost.shards) {
    useUiStore.getState().toast(t('heroes:not_enough_shards'), 'error');
    return false;
  }
  if (inv.countOf('awaken_crystal') < cost.crystals) {
    useUiStore.getState().toast(t('heroes:not_enough_crystals'), 'error');
    return false;
  }
  if (!usePlayerStore.getState().spend({ gold: cost.gold })) {
    useUiStore.getState().toast(t('common:not_enough_gold'), 'error');
    return false;
  }
  heroStore.addShards(defId, -cost.shards);
  if (cost.crystals) inv.removeItem('awaken_crystal', cost.crystals);
  heroStore.starUp(defId);
  return true;
}

export function upgradeHeroSkill(defId: string, skillId: string): boolean {
  const heroStore = useHeroStore.getState();
  const h = heroStore.heroes[defId];
  if (!h) return false;
  const lv = h.skillLevels[skillId] ?? 1;
  if (lv >= MAX_SKILL_LEVEL) return false;
  const cost = skillUpgradeCost(lv);
  const inv = useInventoryStore.getState();
  if (inv.countOf('skill_book') < cost.books) {
    useUiStore.getState().toast(t('heroes:not_enough_books'), 'error');
    return false;
  }
  if (!usePlayerStore.getState().spend({ gold: cost.gold })) {
    useUiStore.getState().toast(t('common:not_enough_gold'), 'error');
    return false;
  }
  inv.removeItem('skill_book', cost.books);
  return heroStore.upgradeSkill(defId, skillId);
}

// ───────────────────────── Equipment ─────────────────────────

export function equipItem(heroId: string, itemUid: string): boolean {
  const inv = useInventoryStore.getState();
  const heroStore = useHeroStore.getState();
  const item = inv.getItem(itemUid);
  if (!item) return false;
  const def = getItemDef(item.defId);
  if (!def.slot) return false;
  const hero = heroStore.heroes[heroId];
  if (!hero) return false;
  // Unequip from previous owner
  if (item.equippedBy && item.equippedBy !== heroId) {
    heroStore.setEquipment(item.equippedBy, def.slot, undefined);
  }
  // Unequip currently equipped item in this slot
  const current = hero.equipment[def.slot];
  if (current) inv.setEquippedBy(current, undefined);
  heroStore.setEquipment(heroId, def.slot, itemUid);
  inv.setEquippedBy(itemUid, heroId);
  return true;
}

export function unequipItem(heroId: string, slot: EquipSlot): void {
  const heroStore = useHeroStore.getState();
  const hero = heroStore.heroes[heroId];
  const current = hero?.equipment[slot];
  if (!current) return;
  useInventoryStore.getState().setEquippedBy(current, undefined);
  heroStore.setEquipment(heroId, slot, undefined);
}

export function enhanceItem(itemUid: string): boolean {
  const inv = useInventoryStore.getState();
  const item = inv.getItem(itemUid);
  if (!item || (item.enhance ?? 0) >= MAX_ENHANCE) return false;
  const cost = enhanceCost(item.enhance ?? 0);
  if (inv.countOf('enhance_stone') < cost.stones) {
    useUiStore.getState().toast(t('inventory:not_enough_stones'), 'error');
    return false;
  }
  if (!usePlayerStore.getState().spend({ gold: cost.gold })) {
    useUiStore.getState().toast(t('common:not_enough_gold'), 'error');
    return false;
  }
  inv.removeItem('enhance_stone', cost.stones);
  inv.enhance(itemUid);
  usePlayerStore.getState().bumpStat('enhances');
  useQuestStore.getState().track({ type: 'enhance' });
  return true;
}

export function sellItem(itemUid: string, qty = 1): boolean {
  const inv = useInventoryStore.getState();
  const item = inv.getItem(itemUid);
  if (!item || item.equippedBy) return false;
  const def = getItemDef(item.defId);
  const price = Math.round(def.sellPrice * (1 + (item.enhance ?? 0) * 0.3)) * qty;
  if (!inv.removeItem(itemUid, qty)) return false;
  usePlayerStore.getState().addCurrency({ gold: price });
  useUiStore.getState().toast(`+${price} ${t('common:gold')}`, 'reward');
  return true;
}

export function drinkEnergyPotion(): boolean {
  const inv = useInventoryStore.getState();
  if (!inv.removeItem('energy_potion', 1)) return false;
  usePlayerStore.getState().addCurrency({ energy: getItemDef('energy_potion').value ?? 30 });
  return true;
}

// ───────────────────────── Quests / mail / shop ─────────────────────────

export function claimQuest(questId: string): boolean {
  const quests = useQuestStore.getState();
  const p = quests.progress[questId];
  const q = QUEST_MAP[questId];
  if (!q || !p?.completed || p.claimed) return false;
  quests.markClaimed(questId);
  grantReward(q.reward);
  return true;
}

export function claimMail(mailId: string): boolean {
  const mail = useMailStore.getState();
  const m = mail.mails.find((x) => x.id === mailId);
  if (!m || m.claimed || !m.reward) return false;
  mail.markClaimed(mailId);
  grantReward(m.reward);
  return true;
}

export function purchaseOffer(offer: ShopOffer): { ok: boolean; reason?: string } {
  const shop = useShopStore.getState();
  if (offer.limit && (shop.purchases[offer.id] ?? 0) >= offer.limit)
    return { ok: false, reason: t('shop:sold_out') };
  const player = usePlayerStore.getState();
  if ('real' in offer.cost) {
    // IAP placeholder: no store integration yet – grant directly (dev mode).
    shop.recordPurchase(offer.id);
    grantReward(offer.reward);
    return { ok: true };
  }
  if (!player.spend(offer.cost)) return { ok: false, reason: t('shop:cannot_afford') };
  shop.recordPurchase(offer.id);
  grantReward(offer.reward);
  return { ok: true };
}

export function guildContribute(): boolean {
  const guild = useGuildStore.getState();
  if (!guild.guildId || guild.dailyContributed) return false;
  if (!usePlayerStore.getState().spend({ gold: 1000 })) {
    useUiStore.getState().toast(t('common:not_enough_gold'), 'error');
    return false;
  }
  guild.contribute(50);
  grantReward({ currencies: { guildCoins: 30 }, xp: 20 });
  useQuestStore.getState().track({ type: 'guildContribute' });
  return true;
}

// ───────────────────────── Daily / weekly reset & login ─────────────────────────

export function runResets(): void {
  const player = usePlayerStore.getState();
  const now = Date.now();
  const today = dayKey(now);
  if (dayKey(player.profile.lastDailyReset) !== today) {
    useQuestStore.getState().resetCategory('daily');
    useShopStore.getState().resetDaily();
    useArenaStore.getState().resetDaily();
    useGuildStore.getState().resetDaily();
    player.setDailyReset(now);

    // Daily login reward via mail
    const streak =
      dayKey(player.profile.lastLoginClaim + 86400000) === today
        ? player.profile.loginStreak + 1
        : 1;
    const reward = DAILY_LOGIN_REWARDS[(streak - 1) % DAILY_LOGIN_REWARDS.length];
    useMailStore
      .getState()
      .send('login_title', 'login_body', { currencies: reward }, { day: streak });
    player.claimLogin(now, streak);
    useQuestStore.getState().track({ type: 'claimDaily' });
  }
  if (weekKey(player.profile.lastWeeklyReset) !== weekKey(now)) {
    useQuestStore.getState().resetCategory('weekly');
    player.setWeeklyReset(now);
  }
  useQuestStore
    .getState()
    .track({ type: 'ownHeroes', count: Object.keys(useHeroStore.getState().heroes).length });
  useQuestStore.getState().track({ type: 'playerLevel', level: player.profile.level });
}

export function resetAllProgress(): void {
  usePlayerStore.getState().reset();
  useHeroStore.getState().reset();
  useInventoryStore.getState().reset();
  useQuestStore.getState().reset();
  useProgressStore.getState().reset();
  useShopStore.getState().reset();
  useArenaStore.getState().reset();
  useGuildStore.getState().reset();
  useMailStore.getState().reset();
  useCombatStore.getState().clear();
}

export function regionName(regionId: string): string {
  return t(`world-map:regions.${regionId}.name`);
}

export { REGION_MAP };
