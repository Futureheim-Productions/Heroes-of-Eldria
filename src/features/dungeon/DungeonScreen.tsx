import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/misc';
import { HeroPortrait } from '@/components/game/HeroPortrait';
import { REGION_MAP, HARD_MULT } from '@/data/dungeons';
import { getMonsterDef } from '@/data/monsters';
import { monsterArt } from '@/data/monsterArt';
import { getItemDef } from '@/data/items';
import { getHeroDef } from '@/data/heroes';
import { useProgressStore } from '@/stores/progressStore';
import { useHeroStore } from '@/stores/heroStore';
import { useUiStore } from '@/stores/uiStore';
import { startDungeon, teamPower } from '@/services/game';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/services/haptics';

export default function DungeonScreen() {
  const { regionId = 'norsheim' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['dungeon', 'world-map', 'monsters', 'items', 'common', 'heroes']);
  const region = REGION_MAP[regionId];
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
  const [stageId, setStageId] = useState<string>(params.get('stage') ?? region?.stages[0].id);
  const stages = useProgressStore((s) => s.stages);
  const isStageUnlocked = useProgressStore((s) => s.isStageUnlocked);
  const formation = useHeroStore((s) => s.formation);
  const heroes = useHeroStore((s) => s.heroes);
  const toast = useUiStore((s) => s.toast);

  const paramStage = params.get('stage');
  useEffect(() => {
    if (paramStage && region?.stages.some((s) => s.id === paramStage)) setStageId(paramStage);
    else if (region && !region.stages.some((s) => s.id === stageId))
      setStageId(region.stages[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, paramStage]);

  const stage = useMemo(
    () => region?.stages.find((s) => s.id === stageId) ?? region?.stages[0],
    [region, stageId],
  );
  const power = teamPower();
  if (!region || !stage) return null;

  const hardUnlocked = (stages[region.stages[region.stages.length - 1].id]?.normalClears ?? 0) > 0;
  const unlocked = isStageUnlocked(stage.id, difficulty);
  const energyCost = difficulty === 'hard' ? Math.round(stage.energyCost * 1.5) : stage.energyCost;
  const recPower = Math.round(
    stage.recommendedPower * (difficulty === 'hard' ? HARD_MULT.stats : 1),
  );
  const teamHeroes = formation.filter((id): id is string => !!id && !!heroes[id]);

  const start = () => {
    const r = startDungeon(stage.id, difficulty);
    if (!r.ok) {
      toast(r.reason ?? '', 'error');
      return;
    }
    haptic('heavy');
    navigate('/combat', { replace: false });
  };

  return (
    <Screen
      title={`${region.glyph} ${t(`world-map:regions.${region.id}.name`)}`}
      bodyClassName="flex gap-3 !overflow-hidden"
    >
      {/* Stage list */}
      <div className="flex w-[180px] shrink-0 flex-col gap-2">
        <div className="flex gap-1">
          <Chip active={difficulty === 'normal'} onClick={() => setDifficulty('normal')}>
            {t('dungeon:normal')}
          </Chip>
          <Chip
            active={difficulty === 'hard'}
            onClick={() => {
              if (!hardUnlocked) toast(t('dungeon:hard_locked'), 'error');
              else setDifficulty('hard');
            }}
            className={hardUnlocked ? '' : 'opacity-50'}
          >
            {t('dungeon:hard')} {hardUnlocked ? '' : '🔒'}
          </Chip>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {region.stages.map((s) => {
            const p = stages[s.id];
            const st = difficulty === 'hard' ? (p?.hardStars ?? 0) : (p?.normalStars ?? 0);
            const un = isStageUnlocked(s.id, difficulty);
            const boss = s.enemies.some((e) => e.boss);
            return (
              <button
                key={s.id}
                onClick={() => {
                  haptic('light');
                  setStageId(s.id);
                }}
                className={`btn-press flex items-center justify-between rounded-lg border px-2.5 py-2 text-left ${
                  s.id === stage.id ? 'border-gold bg-gold/15' : 'border-white/10 bg-black/30'
                } ${un ? '' : 'opacity-50'}`}
              >
                <div>
                  <div className="text-[12px] font-semibold">
                    {t('dungeon:stage', { n: s.index })}{' '}
                    {boss && (
                      <span className="ml-1 rounded bg-blood px-1 text-[8px] font-bold text-white">
                        {t('dungeon:boss')}
                      </span>
                    )}
                  </div>
                  <div className="line-clamp-1 text-[9px] text-ink-dim">
                    {t(`dungeon:stages.${s.id}.name`)}
                  </div>
                  <div className="text-[9px] text-gold-2">
                    {'★'.repeat(st)}
                    <span className="text-white/20">{'★'.repeat(3 - st)}</span>
                  </div>
                </div>
                <span className="text-[10px] text-ink-dim">
                  {un
                    ? `⚡${difficulty === 'hard' ? Math.round(s.energyCost * 1.5) : s.energyCost}`
                    : '🔒'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage details */}
      <div className="panel flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-gold">
              {t('dungeon:stage', { n: stage.index })} · {t(`dungeon:${difficulty}`)}
            </h2>
            <div className="text-[11px] font-semibold text-ink">
              {t(`dungeon:stages.${stage.id}.name`)}
            </div>
            <div className="text-[10px] text-ink-dim">
              {t('dungeon:energy_cost', { n: energyCost })} ·{' '}
              <span className={power >= recPower ? 'text-hp' : 'text-blood-2'}>
                {t('dungeon:recommended', { n: formatNumber(recPower) })}
              </span>
            </div>
          </div>
          <div className="text-right text-[10px] text-ink-dim">
            {t('common:power')} <span className="font-bold text-gold-2">{formatNumber(power)}</span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto">
          <div>
            <div className="panel-title mb-1">{t('dungeon:enemies')}</div>
            <div className="flex flex-wrap gap-2">
              {stage.enemies.map((e, i) => {
                const m = getMonsterDef(e.monsterId);
                return (
                  <div key={i} className="flex w-[70px] flex-col items-center gap-0.5 text-center">
                    <HeroPortrait
                      art={monsterArt(m.id)}
                      artCrop="loose"
                      glyph={m.glyph}
                      element={m.element}
                      rarity={m.rarity}
                      size={44}
                      boss={e.boss}
                    />
                    <div className="line-clamp-2 text-[9px] leading-tight">
                      {t(`monsters:${m.id}.name`)}
                    </div>
                    <div className="text-[8px] text-ink-dim">
                      Lv {e.level + (difficulty === 'hard' ? HARD_MULT.level : 0)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-[9px] italic text-ink-dim">
              {t(`monsters:${stage.enemies[0].monsterId}.special`)}
            </div>
          </div>
          <div>
            <div className="panel-title mb-1">{t('dungeon:rewards')}</div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full bg-black/40 px-2 py-[2px]">
                💰{' '}
                {formatNumber(
                  (stage.rewards.currencies?.gold ?? 0) *
                    (difficulty === 'hard' ? HARD_MULT.rewards : 1),
                )}
              </span>
              <span className="rounded-full bg-black/40 px-2 py-[2px]">
                ✨{' '}
                {formatNumber(
                  (stage.rewards.xp ?? 0) * (difficulty === 'hard' ? HARD_MULT.rewards : 1),
                )}{' '}
                XP
              </span>
            </div>
            <div className="panel-title mb-1 mt-2">{t('dungeon:possible_drops')}</div>
            <div className="flex flex-wrap gap-1">
              {stage.drops.map((d) => {
                const def = getItemDef(d.itemId);
                return (
                  <span
                    key={d.itemId}
                    className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-[2px] text-[10px]"
                    title={t(`items:${d.itemId}.name`)}
                  >
                    <span>{def.glyph}</span>
                    <span className="text-ink-dim">{Math.round(d.chance * 100)}%</span>
                  </span>
                );
              })}
            </div>
            {stage.firstClearBonus &&
              !(difficulty === 'normal'
                ? stages[stage.id]?.normalClears
                : stages[stage.id]?.hardClears) && (
                <div className="mt-2 text-[10px] text-gold-2">
                  {t('dungeon:first_clear')}: 💎 {stage.firstClearBonus.currencies?.gems}
                  {stage.firstClearBonus.currencies?.keys
                    ? ` · 🔑 ${stage.firstClearBonus.currencies.keys}`
                    : ''}
                </div>
              )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 pt-2">
          <button
            onClick={() => navigate('/formation')}
            className="btn-press flex items-center gap-1"
          >
            {teamHeroes.length ? (
              teamHeroes.map((id) => {
                const d = getHeroDef(id);
                return (
                  <HeroPortrait
                    key={id}
                    heroId={id}
                    glyph={d.glyph}
                    element={d.element}
                    rarity={d.rarity}
                    size={32}
                  />
                );
              })
            ) : (
              <span className="text-[11px] text-blood-2">{t('dungeon:no_formation')}</span>
            )}
            <span className="ml-1 text-[10px] text-gold underline">{t('dungeon:edit_team')}</span>
          </button>
          <Button className="ml-auto" size="lg" onClick={start} disabled={!unlocked} icon="⚔️">
            {unlocked ? t('dungeon:start') : t('common:locked')}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
