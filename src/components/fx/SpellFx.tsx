import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useSpellSprite } from '@/hooks/useSpellSprite';
import { sheetBackgroundSize, type SpriteSheetConfig } from '@/utils/spriteSheet';

export interface SpellFxHandle {
  play: (opts?: { onHit?: () => void; onComplete?: () => void; timeScale?: number }) => void;
  stop: () => void;
}

interface SpellFxProps {
  sheet: SpriteSheetConfig;
  /**
   * `center` (default): `x`/`y` is the effect's center inside the positioned parent.
   * `bottom`: `x` is the horizontal center and `y` the sprite's bottom edge, measured
   * from the parent's bottom – for sheets whose action sits on the ground.
   */
  anchor?: 'center' | 'bottom';
  x?: number | string;
  y?: number | string;
  /** 1 = `sheet.size` px. */
  scale?: number;
  /** Mirror horizontally (e.g. effects that "face" the caster). */
  flip?: boolean;
  className?: string;
}

/** One sprite-sheet burst. Hidden until `play()` is called on the handle. */
export const SpellFx = forwardRef<SpellFxHandle, SpellFxProps>(function SpellFx(
  { sheet, anchor = 'center', x = '50%', y, scale = 1, flip, className = '' },
  ref,
) {
  const { elRef, play, stop } = useSpellSprite(sheet);
  useImperativeHandle(ref, () => ({ play, stop }), [play, stop]);
  const px = sheet.size * scale;
  const placement =
    anchor === 'bottom'
      ? { left: x, bottom: y ?? 0, transform: `translate(-50%, 0)${flip ? ' scaleX(-1)' : ''}` }
      : {
          left: x,
          top: y ?? '50%',
          transform: `translate(-50%, -50%)${flip ? ' scaleX(-1)' : ''}`,
        };
  return (
    <div
      ref={elRef}
      className={`spell-fx ${className}`}
      style={{
        ...placement,
        width: px,
        height: px,
        backgroundImage: `url(${sheet.src})`,
        backgroundSize: sheetBackgroundSize(sheet),
        mixBlendMode: sheet.blend === 'screen' ? 'screen' : undefined,
      }}
    />
  );
});

interface SpellFxAutoProps extends SpellFxProps {
  /** GSAP timeScale – pass the battle speed so x2/x3 also speeds the FX up. */
  timeScale?: number;
  onHit?: () => void;
  /** Called when the last frame has been shown – unmount the component here. */
  onDone?: () => void;
}

/** Plays once as soon as it mounts. Spawn one per burst and remove it in `onDone`. */
export function SpellFxAuto({ timeScale = 1, onHit, onDone, ...props }: SpellFxAutoProps) {
  const ref = useRef<SpellFxHandle>(null);
  const cbs = useRef({ onHit, onDone });
  cbs.current = { onHit, onDone };
  useEffect(() => {
    ref.current?.play({
      timeScale,
      onHit: () => cbs.current.onHit?.(),
      onComplete: () => cbs.current.onDone?.(),
    });
  }, [timeScale]);
  return <SpellFx ref={ref} {...props} />;
}
