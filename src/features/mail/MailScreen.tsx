import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { useMailStore } from '@/stores/metaStores';
import { claimMail, describeReward } from '@/services/game';
import { haptic } from '@/services/haptics';
import { useStaggerIn } from '@/hooks/useScreenEnter';

export default function MailScreen() {
  const { t, i18n } = useTranslation(['mail', 'common']);
  const mails = useMailStore((s) => s.mails);
  const markRead = useMailStore((s) => s.markRead);
  const remove = useMailStore((s) => s.remove);
  const [openId, setOpenId] = useState<string | null>(mails[0]?.id ?? null);
  const ref = useStaggerIn([mails.length]);
  const open = mails.find((m) => m.id === openId);

  return (
    <Screen title={t('mail:title')} bodyClassName="flex gap-3 !overflow-hidden">
      <div ref={ref} className="flex w-[280px] shrink-0 flex-col gap-1 overflow-y-auto">
        {mails.length === 0 && <EmptyState text={t('mail:empty')} glyph="📭" />}
        {mails.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              haptic('light');
              setOpenId(m.id);
              markRead(m.id);
            }}
            className={`btn-press panel flex items-center gap-2 px-3 py-2 text-left ${openId === m.id ? 'border-gold/60 bg-gold/10' : ''}`}
          >
            <span className="text-lg">{m.reward && !m.claimed ? '🎁' : m.read ? '📄' : '✉️'}</span>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-[12px] ${m.read ? 'text-ink-dim' : 'font-bold'}`}>
                {t(`mail:${m.titleKey}`, m.params)}
              </div>
              <div className="text-[9px] text-ink-dim">
                {new Date(m.createdAt).toLocaleDateString(i18n.language)}
              </div>
            </div>
            {!m.read && <span className="h-2 w-2 rounded-full bg-blood" />}
          </button>
        ))}
      </div>
      <div className="panel flex min-w-0 flex-1 flex-col p-4">
        {open ? (
          <>
            <h2 className="text-[15px] font-bold text-gold">
              {t(`mail:${open.titleKey}`, open.params)}
            </h2>
            <div className="text-[10px] text-ink-dim">
              {new Date(open.createdAt).toLocaleString(i18n.language)}
            </div>
            <p className="mt-3 flex-1 text-[13px] leading-relaxed">
              {t(`mail:${open.bodyKey}`, open.params)}
            </p>
            {open.reward && (
              <div className="mb-2 text-[11px] text-gold-2">🎁 {describeReward(open.reward)}</div>
            )}
            <div className="flex gap-2">
              {open.reward && (
                <Button
                  disabled={open.claimed}
                  onClick={() => claimMail(open.id) && haptic('success')}
                  icon="🎁"
                >
                  {open.claimed ? t('common:claimed') : t('common:claim')}
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                className="ml-auto"
                disabled={!!open.reward && !open.claimed}
                onClick={() => {
                  remove(open.id);
                  setOpenId(null);
                }}
              >
                {t('mail:delete')}
              </Button>
            </div>
          </>
        ) : (
          <EmptyState text={t('mail:empty')} glyph="✉️" />
        )}
      </div>
    </Screen>
  );
}
