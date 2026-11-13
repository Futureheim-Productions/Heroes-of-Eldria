import type { StatusId } from '@/types';
import type { SpellFxId } from './spellFx';

/**
 * Transformations: while a hero carries `status`, their battle sprite is swapped for `art`.
 * The swap happens on the last frame of `transformFx`, which plays on the hero itself the
 * first time the status is gained (it does not replay while the form is still active).
 *
 * To add one: drop `<Hero>_<Name>Form.png` (the sprite) and the transformation sheet in
 * art/raw/fx, run `npm run fx-art`, then add an entry here.
 */
export interface HeroForm {
  status: StatusId;
  art: string;
  /** Sprite width / height – wings make a form wider than the 2:3 default. */
  aspect: number;
  /** Box height relative to the normal sprite. */
  scale: number;
  transformFx: SpellFxId;
}

export const HERO_FORMS: Record<string, HeroForm> = {
  kael: {
    status: 'dragonForm',
    art: 'heroes/forms/kael_drakensson_dragon_form.png',
    aspect: 1,
    scale: 1.12,
    transformFx: 'kael_drakensson_ulti',
  },
};

export const heroForm = (defId: string): HeroForm | undefined => HERO_FORMS[defId];
