import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { HeroPortrait } from '@/components/game/HeroPortrait';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatRow } from '@/components/ui/misc';
import { usePlayerStore } from '@/stores/playerStore';
import { useHeroStore } from '@/stores/heroStore';
import { useProgressStore } from '@/stores/progressStore';
import { getHeroDef } from '@/data/heroes';
import { teamPower } from '@/services/game';
import { playerXpForLevel } from '@/utils/constants';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/services/haptics';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation(['profile', 'common', 'heroes']);
  const profile = usePlayerStore((s) => s.profile);
  const setAvatar = usePlayerStore((s) => s.setAvatar);
  const heroes = useHeroStore((s) => s.heroes);
  const totalStars = useProgressStore((s) => s.totalStars)();
  const avatar = getHeroDef(profile.avatarHeroId);
  const needed = playerXpForLevel(profile.level);

  return (
    <Screen title={t('profile:title')} bodyClassName="flex gap-3">
      <div className="panel flex w-[240px] shrink-0 flex-col items-center gap-2 p-3">
        <HeroPortrait
          heroId={avatar.id}
          glyph={avatar.glyph}
          element={avatar.element}
          rarity={avatar.rarity}
          size={90}
          className="rarity-glow-legendary"
        />
        <div className="font-display text-[16px] font-bold text-gold">{profile.name}</div>
        <div className="text-[11px] text-ink-dim">
          {t('common:level', { level: profile.level })}
        </div>
        <div className="w-full">
          <ProgressBar value={profile.xp} max={needed} color="#7c4dff" height={8} />
          <div className="mt-0.5 text-center text-[9px] text-ink-dim">
            {t('profile:xp_to_next', {
              current: formatNumber(profile.xp),
              needed: formatNumber(needed),
            })}
          </div>
        </div>
        <div className="text-[10px] text-ink-dim">
          {t('profile:member_since', {
            date: new Date(profile.createdAt).toLocaleDateString(i18n.language),
          })}
        </div>
        <div className="text-[10px] text-ink-dim">
          {t('profile:login_streak', { n: profile.loginStreak })}
        </div>
        <div className="mt-2 w-full">
          <div className="panel-title mb-1">{t('profile:avatar')}</div>
          <div className="flex flex-wrap gap-1">
            {Object.keys(heroes).map((id) => {
              const d = getHeroDef(id);
              return (
                <button
                  key={id}
                  onClick={() => {
                    haptic('light');
                    setAvatar(id);
                  }}
                  className={`btn-press rounded-lg ${profile.avatarHeroId === id ? 'ring-2 ring-gold' : ''}`}
                >
                  <HeroPortrait
                    heroId={id}
                    glyph={d.glyph}
                    element={d.element}
                    rarity={d.rarity}
                    size={32}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="panel flex-1 p-3">
        <div className="panel-title mb-1">{t('profile:stats')}</div>
        <div className="grid grid-cols-2 gap-x-6">
          <StatRow label={t('profile:team_power')} value={formatNumber(teamPower())} />
          <StatRow label={t('profile:heroes_owned')} value={Object.keys(heroes).length} />
          <StatRow label={t('profile:total_stars')} value={totalStars} />
          <StatRow label={t('profile:battles_won')} value={profile.stats.battlesWon} />
          <StatRow label={t('profile:battles_lost')} value={profile.stats.battlesLost} />
          <StatRow label={t('profile:arena_wins')} value={profile.stats.arenaWins} />
          <StatRow label={t('profile:summons')} value={profile.stats.summons} />
          <StatRow label={t('profile:enhances')} value={profile.stats.enhances} />
          <StatRow label={t('common:gold')} value={formatNumber(profile.currencies.gold)} />
          <StatRow label={t('common:gems')} value={formatNumber(profile.currencies.gems)} />
          <StatRow label={t('common:arenaCoins')} value={profile.currencies.arenaCoins} />
          <StatRow label={t('common:guildCoins')} value={profile.currencies.guildCoins} />
        </div>
      </div>
    </Screen>
  );
}
