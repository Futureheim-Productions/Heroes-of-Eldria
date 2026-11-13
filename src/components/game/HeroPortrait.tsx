import type { Element, Rarity } from '@/types';
import { ELEMENT_COLORS, RARITY_COLORS } from '@/utils/constants';
import { heroArt } from '@/data/heroArt';
import { useHeroStore } from '@/stores/heroStore';

interface HeroPortraitProps {
  glyph: string;
  element: Element;
  rarity: Rarity;
  size?: number;
  className?: string;
  dead?: boolean;
  boss?: boolean;
  /** Optional artwork URL – shown as a head-and-shoulders crop */
  art?: string;
  /** Hero id – resolves registered artwork (and the owned hero's selected skin) automatically */
  heroId?: string;
  /** Skin override; defaults to the owned hero's selection */
  skin?: number;
  /** face = tight head crop (hero art), loose = upper-body crop (creature art) */
  artCrop?: 'face' | 'loose';
}

/** Portrait medallion: hero artwork (cropped) or a procedural glyph, tinted by element with a rarity frame. */
export function HeroPortrait({
  glyph,
  element,
  rarity,
  size = 64,
  className = '',
  dead,
  boss,
  art,
  heroId,
  skin,
  artCrop = 'face',
}: HeroPortraitProps) {
  const ownedSkin = useHeroStore((s) => (heroId ? s.heroes[heroId]?.skin : undefined));
  const src = art ?? (heroId ? heroArt(heroId, skin ?? ownedSkin) : undefined);
  const el = ELEMENT_COLORS[element];
  const rc = RARITY_COLORS[rarity];
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${el}66, transparent 60%), linear-gradient(160deg, #2a2140 0%, #120e1f 100%)`,
        border: `2px solid ${rc}`,
        boxShadow: `inset 0 0 ${size / 4}px ${el}33, 0 2px 8px rgba(0,0,0,0.5)${rarity === 'legendary' ? `, 0 0 12px ${rc}88` : ''}`,
        filter: dead ? 'grayscale(1) brightness(0.5)' : undefined,
        transition: 'filter 0.4s ease',
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none"
          style={{
            objectFit: 'cover',
            // Full-body art is 2:3 – zoom to the upper third for a face crop
            objectPosition: artCrop === 'face' ? '50% 8%' : '50% 20%',
            transform: artCrop === 'face' ? 'scale(2.4)' : 'scale(1.5)',
            transformOrigin: artCrop === 'face' ? '50% 9%' : '50% 25%',
          }}
        />
      ) : (
        <span
          style={{ fontSize: size * 0.52, lineHeight: 1 }}
          className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]"
        >
          {glyph}
        </span>
      )}
      {boss && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-blood px-1 text-[8px] font-bold uppercase tracking-wider text-white shadow">
          BOSS
        </span>
      )}
    </div>
  );
}

/** Full-body artwork with the white background knocked out via blend mode, for detail/menu screens. */
export function HeroArt({
  src,
  height = 240,
  className = '',
}: {
  src: string;
  height?: number;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={`pointer-events-none select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] ${className}`}
      style={{ height, width: 'auto' }}
    />
  );
}
