import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Chip } from '@/components/ui/misc';
import { OfferCard } from '@/features/shop/OfferCard';
import { AI_GUILDS } from '@/data/social';
import { GUILD_SHOP } from '@/data/shop';
import { useGuildStore } from '@/stores/metaStores';
import { usePlayerStore } from '@/stores/playerStore';
import { guildContribute } from '@/services/game';
import { haptic } from '@/services/haptics';
import { useStaggerIn } from '@/hooks/useScreenEnter';

const GLYPHS = ['🏰', '🐺', '🔥', '❄️', '🌟', '🗡️', '🛡️', '🐉'];

export default function GuildScreen() {
  const { t } = useTranslation(['guild', 'common']);
  const guild = useGuildStore();
  const profile = usePlayerStore((s) => s.profile);
  const [tab, setTab] = useState<'members' | 'shop'>('members');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [glyph, setGlyph] = useState(GLYPHS[0]);
  const ref = useStaggerIn([guild.guildId, tab]);

  const current = guild.customGuild ?? AI_GUILDS.find((g) => g.id === guild.guildId);
  const guildLevel = guild.customGuild
    ? 1 + Math.floor(guild.guildXp / 500)
    : (AI_GUILDS.find((g) => g.id === guild.guildId)?.level ?? 1);

  if (!current) {
    return (
      <Screen title={t('guild:title')}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] text-ink-dim">{t('guild:no_guild')}</span>
          <Button size="sm" variant="secondary" onClick={() => setCreating(true)} icon="➕">
            {t('guild:create')}
          </Button>
        </div>
        <div ref={ref} className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {AI_GUILDS.map((g) => (
            <div key={g.id} className="panel flex flex-col gap-1.5 p-3">
              <div className="flex items-center gap-2">
                <span className="text-[28px]">{g.glyph}</span>
                <div>
                  <div className="text-[13px] font-bold">{g.name}</div>
                  <div className="text-[9px] text-ink-dim">
                    {t('guild:level', { n: g.level })} ·{' '}
                    {t('guild:members', { n: g.members, max: g.maxMembers })}
                  </div>
                </div>
              </div>
              <p className="flex-1 text-[10px] text-ink-dim">{g.description}</p>
              <Button
                size="sm"
                disabled={g.members >= g.maxMembers}
                onClick={() => {
                  guild.join(g.id, g.level * 17 + g.members, g.members);
                  haptic('success');
                }}
              >
                {t('guild:join')}
              </Button>
            </div>
          ))}
        </div>
        <Modal
          open={creating}
          onClose={() => setCreating(false)}
          title={t('guild:create')}
          width={420}
        >
          <div className="flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('guild:name_placeholder')}
              maxLength={20}
              className="rounded-lg border border-gold/30 bg-black/50 px-3 py-2 text-[13px] outline-none focus:border-gold"
            />
            <div className="flex flex-wrap gap-1.5">
              {GLYPHS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGlyph(g)}
                  className={`btn-press flex h-10 w-10 items-center justify-center rounded-lg border text-xl ${glyph === g ? 'border-gold bg-gold/20' : 'border-white/10 bg-black/40'}`}
                >
                  {g}
                </button>
              ))}
            </div>
            <Button
              disabled={name.trim().length < 3}
              onClick={() => {
                guild.createGuild(name.trim(), glyph);
                setCreating(false);
                haptic('success');
              }}
            >
              {t('guild:create')}
            </Button>
          </div>
        </Modal>
      </Screen>
    );
  }

  const members = [
    {
      id: 'me',
      name: profile.name,
      level: profile.level,
      contribution: guild.contribution,
      role: guild.customGuild ? ('leader' as const) : ('member' as const),
      isPlayer: true,
    },
    ...guild.members,
  ].sort((a, b) => b.contribution - a.contribution);

  return (
    <Screen title={`${current.glyph} ${current.name}`} bodyClassName="flex gap-3 !overflow-hidden">
      <div className="panel flex w-[230px] shrink-0 flex-col gap-2 p-3">
        <div className="text-center text-[44px]">{current.glyph}</div>
        <div className="text-center font-display text-[15px] font-bold text-gold">
          {current.name}
        </div>
        <div className="text-center text-[10px] text-ink-dim">
          {t('guild:level', { n: guildLevel })} ·{' '}
          {t('guild:members', { n: members.length, max: 30 })}
        </div>
        <p className="text-center text-[10px] text-ink-dim">
          {guild.customGuild
            ? t('guild:created_desc')
            : AI_GUILDS.find((g) => g.id === guild.guildId)?.description}
        </p>
        <div className="text-center text-[11px] text-gold-2">
          {t('guild:contribution', { n: guild.contribution })}
        </div>
        <Button
          block
          size="sm"
          disabled={guild.dailyContributed}
          onClick={() => guildContribute() && haptic('success')}
          icon="💰"
        >
          {guild.dailyContributed ? t('guild:contributed') : t('guild:contribute')}
        </Button>
        <div className="text-center text-[10px] text-ink-dim">
          🛡️ {profile.currencies.guildCoins}
        </div>
        <Button block size="sm" variant="danger" className="mt-auto" onClick={() => guild.leave()}>
          {t('guild:leave')}
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex gap-1.5">
          <Chip active={tab === 'members'} onClick={() => setTab('members')}>
            {t('guild:member_list')}
          </Chip>
          <Chip active={tab === 'shop'} onClick={() => setTab('shop')}>
            {t('guild:guild_shop')}
          </Chip>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === 'members' ? (
            <div ref={ref} className="flex flex-col gap-1">
              {members.map((m, i) => (
                <div
                  key={m.id}
                  className={`panel flex items-center gap-3 px-3 py-1.5 text-[11px] ${m.isPlayer ? 'border-gold/50' : ''}`}
                >
                  <span className="w-5 text-ink-dim">{i + 1}</span>
                  <span className="flex-1 font-semibold">
                    {m.name} {m.isPlayer && <span className="text-gold-2">({t('guild:you')})</span>}
                  </span>
                  <span className="text-ink-dim">Lv {m.level}</span>
                  <span className="w-16 text-right text-ink-dim">{t(`guild:role.${m.role}`)}</span>
                  <span className="w-16 text-right tabular-nums text-gold-2">{m.contribution}</span>
                </div>
              ))}
            </div>
          ) : (
            <div ref={ref} className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
              {GUILD_SHOP.map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
