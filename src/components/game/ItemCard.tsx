import { useTranslation } from 'react-i18next';
import type { OwnedItem } from '@/types';
import { getItemDef } from '@/data/items';
import { RARITY_COLORS } from '@/utils/constants';
import { haptic } from '@/services/haptics';

interface ItemCardProps {
  item: OwnedItem;
  onClick?: () => void;
  selected?: boolean;
  size?: number;
  showName?: boolean;
}

export function ItemCard({ item, onClick, selected, size = 64, showName = true }: ItemCardProps) {
  const { t } = useTranslation('items');
  const def = getItemDef(item.defId);
  const rc = RARITY_COLORS[def.rarity];
  return (
    <button
      onClick={() => {
        haptic('light');
        onClick?.();
      }}
      className={`btn-press relative flex flex-col items-center gap-1 rounded-lg border bg-black/35 p-1 ${selected ? 'border-gold bg-gold/15' : ''}`}
      style={{
        borderColor: selected ? undefined : `${rc}66`,
        width: showName ? undefined : size + 8,
      }}
    >
      <div
        className="flex items-center justify-center rounded-md"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 40% 30%, ${rc}44, transparent 65%), #17121f`,
          border: `1px solid ${rc}55`,
          fontSize: size * 0.5,
        }}
      >
        {def.glyph}
      </div>
      {item.qty > 1 && (
        <span className="absolute bottom-[calc(50%-4px)] right-1.5 rounded bg-black/80 px-1 text-[9px] font-bold tabular-nums">
          x{item.qty}
        </span>
      )}
      {(item.enhance ?? 0) > 0 && (
        <span className="absolute left-1.5 top-1.5 rounded bg-gold px-1 text-[9px] font-bold text-black">
          +{item.enhance}
        </span>
      )}
      {item.equippedBy && <span className="absolute right-1.5 top-1.5 text-[9px]">🧍</span>}
      {showName && (
        <div
          className="w-full truncate text-center text-[9px] leading-tight text-ink"
          style={{ color: rc }}
        >
          {t(`${def.id}.name`)}
        </div>
      )}
    </button>
  );
}
