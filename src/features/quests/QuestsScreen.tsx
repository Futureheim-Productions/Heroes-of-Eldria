import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestCategory, QuestDef } from '@/types';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Chip, EmptyState } from '@/components/ui/misc';
import { QUESTS } from '@/data/quests';
import { getStage } from '@/data/dungeons';
import { useQuestStore, questTarget } from '@/stores/questStore';
import { claimQuest, describeReward } from '@/services/game';
import { haptic } from '@/services/haptics';
import { useStaggerIn } from '@/hooks/useScreenEnter';

const CATS: QuestCategory[] = ['main', 'daily', 'weekly', 'side'];

export default function QuestsScreen() {
  const { t } = useTranslation(['quests', 'common', 'world-map', 'dungeon']);
  const progress = useQuestStore((s) => s.progress);
  const isAvailable = useQuestStore((s) => s.isAvailable);
  const [cat, setCat] = useState<QuestCategory>('main');
  const ref = useStaggerIn([cat]);

  const list = QUESTS.filter(
    (q) => q.category === cat && isAvailable(q) && !progress[q.id]?.claimed,
  );
  // For main quests only show the first unclaimed one (chain)
  const visible = cat === 'main' ? list.slice(0, 1) : list;

  const objectiveText = (q: QuestDef) => {
    const o = q.objective;
    if (o.type === 'clearStage') {
      const st = getStage(o.stageId);
      return t('quests:objective.clearStage', {
        stage: `${t(`world-map:regions.${st.regionId}.name`)} ${st.index}`,
      });
    }
    return t(`quests:objective.${o.type}`, { ...o });
  };

  const counts = Object.fromEntries(
    CATS.map((c) => [
      c,
      QUESTS.filter(
        (q) =>
          q.category === c &&
          isAvailable(q) &&
          progress[q.id]?.completed &&
          !progress[q.id]?.claimed,
      ).length,
    ]),
  );

  return (
    <Screen title={t('quests:title')}>
      <div className="mb-2 flex gap-1.5">
        {CATS.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {t(`quests:${c}`)}
            {counts[c] > 0 && (
              <span className="ml-1 rounded-full bg-blood px-1 text-[9px] text-white">
                {counts[c]}
              </span>
            )}
          </Chip>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState text={t('quests:empty')} glyph="📜" />
      ) : (
        <div ref={ref} className="flex flex-col gap-2">
          {visible.map((q) => {
            const p = progress[q.id] ?? { progress: 0, completed: false, claimed: false };
            const target = questTarget(q);
            return (
              <div
                key={q.id}
                className={`panel flex items-center gap-3 px-3 py-2 ${p.completed ? 'border-gold/50' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/40 text-xl">
                  {p.completed
                    ? '✅'
                    : cat === 'main'
                      ? '📖'
                      : cat === 'daily'
                        ? '🌞'
                        : cat === 'weekly'
                          ? '📅'
                          : '🗺️'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold">{objectiveText(q)}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <ProgressBar
                      value={Math.min(p.progress, target)}
                      max={target}
                      height={6}
                      color={p.completed ? '#d4af37' : '#7c4dff'}
                      className="max-w-[200px]"
                    />
                    <span className="text-[10px] tabular-nums text-ink-dim">
                      {t('quests:progress', { current: Math.min(p.progress, target), target })}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-gold-2">
                    {t('quests:reward')}: {describeReward(q.reward)}
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!p.completed}
                  onClick={() => {
                    if (claimQuest(q.id)) haptic('success');
                  }}
                >
                  {t('common:claim')}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
