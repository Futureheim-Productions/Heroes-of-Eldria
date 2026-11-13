import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { HeroArt, HeroPortrait } from '@/components/game/HeroPortrait';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/misc';
import { usePlayerStore } from '@/stores/playerStore';
import { useQuestStore } from '@/stores/questStore';
import { useMailStore } from '@/stores/metaStores';
import { useProgressStore } from '@/stores/progressStore';
import { useHeroStore } from '@/stores/heroStore';
import { getHeroDef } from '@/data/heroes';
import { heroArt } from '@/data/heroArt';
import { REGIONS } from '@/data/dungeons';
import { teamPower } from '@/services/game';
import { useStaggerIn } from '@/hooks/useScreenEnter';
import { haptic } from '@/services/haptics';
import { formatNumber } from '@/utils/format';

interface MenuItem {
  key: string;
  glyph: string;
  path: string;
  badge?: number;
}

export default function MainMenuScreen() {
  const { t } = useTranslation(['main-menu', 'common', 'world-map']);
  const navigate = useNavigate();
  const profile = usePlayerStore((s) => s.profile);
  const claimable = useQuestStore((s) => s.claimableCount)();
  const mails = useMailStore((s) => s.mails);
  const unread = mails.filter((m) => !m.read || (m.reward && !m.claimed)).length;
  const stages = useProgressStore((s) => s.stages);
  const listRef = useStaggerIn();
  const [eventOpen, setEventOpen] = useState(false);

  const power = teamPower();
  const avatarDef = getHeroDef(profile.avatarHeroId);
  const avatarSkin = useHeroStore((s) => s.heroes[avatarDef.id]?.skin);
  const art = heroArt(avatarDef.id, avatarSkin);

  const next = (() => {
    for (const r of REGIONS)
      for (const s of r.stages) if (!stages[s.id]?.normalClears) return { region: r, stage: s };
    const last = REGIONS[REGIONS.length - 1];
    return { region: last, stage: last.stages[last.stages.length - 1] };
  })();

  const items: MenuItem[] = [
    { key: 'heroes', glyph: '🛡️', path: '/heroes' },
    { key: 'formation', glyph: '⚔️', path: '/formation' },
    { key: 'inventory', glyph: '🎒', path: '/inventory' },
    { key: 'quests', glyph: '📜', path: '/quests', badge: claimable },
    { key: 'shop', glyph: '🏪', path: '/shop' },
    { key: 'arena', glyph: '🏟️', path: '/arena' },
    { key: 'guild', glyph: '🏰', path: '/guild' },
    { key: 'mail', glyph: '✉️', path: '/mail', badge: unread },
  ];

  const go = (path: string) => {
    haptic('light');
    navigate(path);
  };

  return (
    <Screen
      background="none"
      className="bg-menu"
      bodyClassName="flex gap-3 !overflow-hidden !p-2.5"
    >
      {/* Left: vertical menu */}
      <div className="flex w-[168px] shrink-0 flex-col justify-between">
        <div ref={listRef} className="flex flex-col gap-[4px]">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => go(it.path)}
              className="menu-row btn-press relative flex h-[27px] items-center gap-2 pl-1 pr-2 text-left"
            >
              {!!it.badge && <Badge>{it.badge}</Badge>}
              <span className="flex h-[20px] w-[20px] items-center justify-center rounded-[5px] border border-gold/60 bg-black/50 text-[13px] leading-none">
                {it.glyph}
              </span>
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
                {t(`main-menu:${it.key}`)}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-end gap-4 px-1">
          <RoundButton
            glyph="🎁"
            label={t('main-menu:daily_reward')}
            onClick={() => go('/mail')}
            badge={unread}
          />
          <RoundButton glyph="🔥" label={t('main-menu:event')} onClick={() => setEventOpen(true)} />
        </div>
      </div>

      {/* Center: logo above the avatar hero */}
      <div className="relative flex min-w-0 flex-1 flex-col items-center">
        <img
          src="logo.png"
          alt="Heroes of Eldria"
          draggable={false}
          className="pointer-events-none z-10 h-[34%] max-h-[120px] w-auto shrink-0 select-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]"
        />
        {art ? (
          <HeroArt
            src={art}
            height={330}
            className="-mt-4 min-h-0 max-h-full flex-1 drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          />
        ) : (
          <HeroPortrait
            heroId={avatarDef.id}
            glyph={avatarDef.glyph}
            element={avatarDef.element}
            rarity={avatarDef.rarity}
            size={180}
            className="mb-6 rarity-glow-legendary"
          />
        )}
        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/40 bg-black/60 px-3 py-[2px] text-[10px]">
          <span className="text-ink-dim">{t('main-menu:team_power')}</span>{' '}
          <span className="font-bold text-gold-2">⚔ {formatNumber(power)}</span>
        </div>
      </div>

      {/* Right: season card + adventure */}
      <div className="flex w-[176px] shrink-0 flex-col justify-between">
        <button
          onClick={() => setEventOpen(true)}
          className="season-card btn-press relative flex h-[150px] flex-col items-center justify-end overflow-hidden p-2 text-center"
        >
          <div className="absolute inset-0 flex items-start justify-center pt-3 text-[40px] opacity-90 drop-shadow-[0_0_16px_rgba(179,136,255,0.9)]">
            🌑
          </div>
          <div className="relative text-[9px] uppercase tracking-[0.2em] text-ink-dim">
            {t('main-menu:season', { number: 1 })}
          </div>
          <div className="gold-gradient-text relative font-display text-[13px] font-black uppercase leading-tight">
            {t('main-menu:season_name')}
          </div>
          <div className="relative mt-1.5 rounded border border-gold/60 bg-black/50 px-2 py-[2px] font-display text-[9px] font-bold uppercase tracking-widest text-gold-2">
            {t('main-menu:read_more')}
          </div>
        </button>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => go(`/world/${next.region.id}?stage=${next.stage.id}`)}
            className="btn-press flex items-center justify-between rounded-md border border-gold/40 bg-black/55 px-2.5 py-1 text-left"
          >
            <div>
              <div className="text-[8px] uppercase tracking-wider text-ink-dim">
                {t('main-menu:continue')}
              </div>
              <div className="text-[11px] font-semibold text-gold-2">
                {next.region.glyph} {t(`world-map:regions.${next.region.id}.name`)} ·{' '}
                {next.stage.index}
              </div>
            </div>
            <span className="text-gold">›</span>
          </button>
          <Button
            size="lg"
            block
            onClick={() => go('/world')}
            className="pulse-gold !text-[17px] !tracking-[0.15em]"
          >
            {t('main-menu:adventure')}
          </Button>
        </div>
      </div>

      <Modal
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        title={t('main-menu:season', { number: 1 })}
        width={420}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-[44px]">🌑</div>
          <div className="gold-gradient-text font-display text-lg font-black">
            {t('main-menu:season_name')}
          </div>
          <p className="text-[12px] text-ink-dim">{t('main-menu:season_desc')}</p>
          <div className="panel mt-1 w-full px-3 py-1.5 text-[11px]">
            🔥 {t('main-menu:event_banner')}
          </div>
          <Button className="mt-2" onClick={() => go('/world')}>
            {t('main-menu:adventure')}
          </Button>
        </div>
      </Modal>
    </Screen>
  );
}

function RoundButton({
  glyph,
  label,
  onClick,
  badge,
}: {
  glyph: string;
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button onClick={onClick} className="btn-press relative flex flex-col items-center gap-[2px]">
      {!!badge && <Badge>{badge}</Badge>}
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold/70 bg-gradient-to-b from-[#2a2140] to-[#120e1f] text-[17px] shadow-[0_0_10px_rgba(212,175,55,0.3)]">
        {glyph}
      </span>
      <span className="text-[7px] leading-none text-ink-dim">{label}</span>
    </button>
  );
}
