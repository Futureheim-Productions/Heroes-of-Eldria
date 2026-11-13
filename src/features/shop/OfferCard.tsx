import { useTranslation } from 'react-i18next';
import type { CurrencyId, ShopOffer } from '@/types';
import { Button } from '@/components/ui/Button';
import { CURRENCY_GLYPH } from '@/components/ui/misc';
import { useShopStore } from '@/stores/metaStores';
import { useUiStore } from '@/stores/uiStore';
import { describeReward, purchaseOffer } from '@/services/game';
import { haptic } from '@/services/haptics';

export function OfferCard({ offer }: { offer: ShopOffer }) {
  const { t } = useTranslation(['shop', 'common']);
  const purchases = useShopStore((s) => s.purchases);
  const toast = useUiStore((s) => s.toast);
  const bought = purchases[offer.id] ?? 0;
  const soldOut = !!offer.limit && bought >= offer.limit;

  const costLabel =
    'real' in offer.cost
      ? `$${offer.cost.real.toFixed(2)}`
      : Object.entries(offer.cost)
          .map(([k, v]) => `${CURRENCY_GLYPH[k as CurrencyId]} ${v}`)
          .join(' ');

  return (
    <div
      className={`panel relative flex flex-col gap-1.5 p-2.5 ${offer.badge === 'hot' ? 'border-blood/50' : offer.badge === 'value' ? 'border-gold/50' : ''}`}
    >
      {offer.badge && (
        <span
          className={`absolute -top-2 left-2 rounded px-1.5 text-[8px] font-bold uppercase tracking-wider text-white ${offer.badge === 'hot' ? 'bg-blood' : offer.badge === 'value' ? 'bg-gold text-black' : 'bg-purple'}`}
        >
          {t(`shop:badge.${offer.badge}`)}
        </span>
      )}
      <div className="flex items-center gap-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black/50 text-[24px]">
          {offer.glyph}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-bold">
            {t(`shop:offers.${offer.id}.name`, { defaultValue: offer.id })}
          </div>
          <div className="line-clamp-2 text-[9px] text-ink-dim">
            {t(`shop:offers.${offer.id}.desc`, { defaultValue: describeReward(offer.reward) })}
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between">
        {offer.limit ? (
          <span className="text-[9px] text-ink-dim">
            {soldOut ? t('shop:sold_out') : t('shop:limit', { n: offer.limit - bought })}
          </span>
        ) : (
          <span />
        )}
        <Button
          size="sm"
          disabled={soldOut}
          onClick={() => {
            const r = purchaseOffer(offer);
            if (!r.ok) toast(r.reason ?? '', 'error');
            else haptic('success');
          }}
        >
          {costLabel}
        </Button>
      </div>
    </div>
  );
}
