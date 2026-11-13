// Generates lore.txt from locale files + hero data. Run: node scripts/lore-txt.cjs
const fs = require('fs');
const { HEROES } = require('./.heroes.tmp.cjs'); // built by: npx esbuild src/data/heroes.ts --bundle --platform=node --format=cjs --alias:@=./src --outfile=scripts/.heroes.tmp.cjs
const sv = JSON.parse(fs.readFileSync('src/locales/sv/heroes.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/locales/en/heroes.json', 'utf8'));
const csv = JSON.parse(fs.readFileSync('src/locales/sv/common.json', 'utf8'));

const rar = { common: 'Vanlig', uncommon: 'Ovanlig', rare: 'Sällsynt', epic: 'Episk', legendary: 'Legendarisk' };
const kind = { basic: 'Grundattack', skill: 'Färdighet', ultimate: 'Ultimate' };
const target = {
  enemy: 'en fiende', enemies: 'alla fiender', ally: 'en allierad', allies: 'hela laget', self: 'sig själv',
  lowestAlly: 'allierad med lägst HP', chain: 'kedja', randomEnemies: 'slumpmässiga fiender', weakestEnemy: 'svagaste fienden', deadAlly: 'fallen allierad',
};
const statsAt = (h, lv) => {
  const g = h.growth, b = h.baseStats, n = lv - 1;
  return { hp: Math.round(b.hp + g.hp * n), atk: Math.round(b.atk + g.atk * n), def: Math.round(b.def + g.def * n), spd: b.spd + Math.floor(n / 10) };
};

let out = 'Heroes of Eldria – Hjältarnas lore, statistik & spells\n===================================================\n';
out += 'Genererad av scripts/lore-txt.cjs från src/data/heroes.ts + src/locales/{sv,en}/heroes.json.\n';
out += 'Stats = grundvärden utan utrustning vid basstjärnor (varje stjärna över 1 ger +12% HP/ATK/DEF).\n\n';

HEROES.forEach((h, i) => {
  const s = sv[h.id], e = en[h.id];
  const l1 = statsAt(h, 1), l30 = statsAt(h, 30), l60 = statsAt(h, 60);
  out += `\n${'='.repeat(78)}\n=== ${i + 1}. ${s.name} – ${s.title} (${s.class}) ===\n${'='.repeat(78)}\n`;
  out += `Id: ${h.id} · ${rar[h.rarity]} · ${csv.element[h.element]} · ${csv.role[h.role]} · ${h.baseStars}★ bas\n\n`;
  out += 'STATISTIK\n';
  out += `  ${'Nivå'.padEnd(8)}${'HP'.padStart(7)}${'ATK'.padStart(7)}${'DEF'.padStart(7)}${'SPD'.padStart(7)}\n`;
  for (const [lv, st] of [[1, l1], [30, l30], [60, l60]])
    out += `  ${String(lv).padEnd(8)}${String(st.hp).padStart(7)}${String(st.atk).padStart(7)}${String(st.def).padStart(7)}${String(st.spd).padStart(7)}\n`;
  out += `  Krit ${h.baseStats.crit}% · Kritskada ${h.baseStats.critDmg}% · Tillväxt/nivå: +${h.growth.hp} HP, +${h.growth.atk} ATK, +${h.growth.def} DEF\n\n`;
  out += 'SPELLS\n';
  for (const sk of h.skills) {
    const n = sv.skills[sk.id], ne = en.skills[sk.id];
    const extra = sk.chainJumps ? ` +${sk.chainJumps} hopp` : sk.count ? ` ×${sk.count}` : '';
    out += `  ${sk.glyph} ${n.name} / ${ne.name}  [${kind[sk.kind]} · ${csv.element[sk.element]} · mål: ${target[sk.target]}${extra}${sk.cooldown ? ` · nedkylning ${sk.cooldown}` : ''}]\n`;
    out += `     SV: ${n.desc}\n     EN: ${ne.desc}\n`;
  }
  out += '\nLORE [SV]\n' + s.desc + '\n\n' + s.lore.join('\n\n') + '\n';
  out += '\nLORE [EN] ' + e.name + ' – ' + e.title + '\n' + e.desc + '\n\n' + e.lore.join('\n\n') + '\n';
});
fs.writeFileSync('lore.txt', out);
console.log('lore.txt:', out.split('\n').length, 'rader,', HEROES.length, 'hjältar');
