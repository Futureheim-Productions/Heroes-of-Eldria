import { describe, expect, it } from 'vitest';
import { SPELL_FX, fxVariants, pickFx, skillFx, skillFxAll } from './spellFx';
import { HERO_MAP } from './heroes';

describe('spell fx variants', () => {
  it('groups `<id>_<n>` sheets under their base id', () => {
    expect(fxVariants('sword_slash')).toEqual(['sword_slash', 'sword_slash_1']);
    expect(fxVariants('fire_slash')).toEqual(['fire_slash', 'fire_slash_1']);
    expect(fxVariants('fire_explosion')).toEqual(['fire_explosion']);
  });

  it('never picks the same variant twice in a row', () => {
    let prev = pickFx('sword_slash');
    for (let i = 0; i < 20; i++) {
      const next = pickFx('sword_slash');
      expect(next).not.toBe(prev);
      prev = next;
    }
  });

  it('always returns the only look of an effect without variants', () => {
    for (let i = 0; i < 5; i++) expect(pickFx('fire_explosion')).toBe(SPELL_FX.fire_explosion);
  });

  it('gives a sword skill both looks, and preloads both', () => {
    const strike = HERO_MAP.arthen.skills.find((s) => s.id === 'arthen_holy_strike')!;
    const seen = new Set(Array.from({ length: 6 }, () => skillFx(strike)?.src));
    expect(seen).toEqual(new Set(['effects/sword_slash.png', 'effects/sword_slash_1.png']));
    expect(skillFxAll(strike).map((s) => s.src)).toEqual([
      'effects/sword_slash.png',
      'effects/sword_slash_1.png',
    ]);
  });
});
