import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { usePlayerStore } from '@/stores/playerStore';
import { useUiStore } from '@/stores/uiStore';
import { resetAllProgress } from '@/services/game';
import { haptic } from '@/services/haptics';

type Language = 'sv' | 'en';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => {
        haptic('light');
        onChange(!checked);
      }}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-white/15'}`}
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-ink shadow transition-all ${checked ? 'left-[23px]' : 'left-[3px]'}`}
      />
    </button>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const profile = usePlayerStore((s) => s.profile);
  const setName = usePlayerStore((s) => s.setName);
  const { musicOn, sfxOn, setMusic, setSfx, toast } = useUiStore();
  const [name, setNameLocal] = useState(profile.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const lang = (i18n.language?.slice(0, 2) as Language) || 'sv';

  const changeLanguage = async (lng: Language) => {
    haptic('light');
    await i18n.changeLanguage(lng);
  };

  return (
    <Screen title={t('settings:title')}>
      <div className="grid grid-cols-2 gap-3">
        <section className="panel p-3">
          <h2 className="panel-title mb-2">{t('settings:language')}</h2>
          <div className="flex gap-2">
            {(
              [
                ['sv', '🇸🇪', 'Svenska'],
                ['en', '🇬🇧', 'English'],
              ] as [Language, string, string][]
            ).map(([code, flag, label]) => (
              <button
                key={code}
                onClick={() => changeLanguage(code)}
                className={`btn-press relative flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-[13px] ${lang === code ? 'border-gold bg-gold/15 shadow-[0_0_12px_rgba(212,175,55,0.2)]' : 'border-white/10 bg-black/35'}`}
              >
                <span className="text-lg">{flag}</span>
                <span>{label}</span>
                {lang === code && <span className="absolute right-3 font-bold text-gold">✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="panel p-3">
          <h2 className="panel-title mb-2">{t('settings:audio')}</h2>
          <div className="flex items-center justify-between py-1.5 text-[13px]">
            <span>{t('settings:music')}</span>
            <Toggle checked={musicOn} onChange={setMusic} />
          </div>
          <div className="flex items-center justify-between border-t border-white/5 py-1.5 text-[13px]">
            <span>{t('settings:sfx')}</span>
            <Toggle checked={sfxOn} onChange={setSfx} />
          </div>
        </section>

        <section className="panel p-3">
          <h2 className="panel-title mb-2">{t('settings:account')}</h2>
          <label className="text-[10px] text-ink-dim">{t('settings:player_name')}</label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setNameLocal(e.target.value)}
              maxLength={16}
              className="min-w-0 flex-1 rounded-lg border border-gold/30 bg-black/50 px-3 py-1.5 text-[13px] outline-none focus:border-gold"
            />
            <Button
              size="sm"
              disabled={name.trim().length < 2 || name === profile.name}
              onClick={() => {
                setName(name);
                toast(t('common:save'), 'success');
              }}
            >
              {t('common:save')}
            </Button>
          </div>
          <div className="mt-2 text-[10px] text-ink-dim">ID: {profile.id}</div>
        </section>

        <section className="panel p-3">
          <h2 className="panel-title mb-2">{t('settings:other')}</h2>
          <button className="block w-full py-1 text-left text-[13px] hover:text-gold">
            {t('settings:privacy')}
          </button>
          <button className="block w-full py-1 text-left text-[13px] hover:text-gold">
            {t('settings:terms')}
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            className="mt-1 block w-full py-1 text-left text-[13px] text-blood-2 hover:text-blood"
          >
            {t('settings:reset')}
          </button>
          <div className="mt-2 text-[10px] text-ink-dim">
            {t('settings:version', { version: '0.1.0' })}
          </div>
        </section>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('settings:reset')}
        width={400}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
              {t('common:cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetAllProgress();
                setConfirmReset(false);
                toast(t('settings:reset_done'), 'success');
                navigate('/');
              }}
            >
              {t('common:confirm')}
            </Button>
          </div>
        }
      >
        <p className="text-[13px]">{t('settings:reset_confirm')}</p>
      </Modal>
    </Screen>
  );
}
