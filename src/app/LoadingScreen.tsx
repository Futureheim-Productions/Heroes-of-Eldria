import { useTranslation } from 'react-i18next';

export function LoadingScreen() {
  const { t } = useTranslation('common');
  return (
    <div className="bg-fantasy flex h-full w-full flex-col items-center justify-center gap-3">
      <div className="gold-gradient-text font-display text-2xl font-black tracking-[0.2em]">
        FANTASY QUEST
      </div>
      <div className="spinner" />
      <div className="text-[11px] uppercase tracking-widest text-ink-dim">{t('loading')}</div>
    </div>
  );
}
