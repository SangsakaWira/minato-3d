// Items, crops, fish and rods. `price` is what a shop charges, `sell` what it pays.
export const ITEMS = {
  seed_lobak: { name: 'Benih Lobak', icon: '🌱', kind: 'seed', crop: 'lobak', price: 10, desc: 'Panen dalam 3 hari' },
  seed_tomat: { name: 'Benih Tomat', icon: '🌱', kind: 'seed', crop: 'tomat', price: 20, desc: 'Panen dalam 4 hari, 2 buah' },
  seed_stroberi: { name: 'Benih Stroberi', icon: '🌱', kind: 'seed', crop: 'stroberi', price: 30, desc: 'Panen dalam 5 hari, 2 buah' },
  lobak: { name: 'Lobak', icon: '🥕', kind: 'crop', sell: 30 },
  tomat: { name: 'Tomat', icon: '🍅', kind: 'crop', sell: 28 },
  stroberi: { name: 'Stroberi', icon: '🍓', kind: 'crop', sell: 45 },
  sarden: { name: 'Ikan Sarden', icon: '🐟', kind: 'fish', sell: 18 },
  kakap: { name: 'Ikan Kakap', icon: '🐠', kind: 'fish', sell: 40 },
  tongkol: { name: 'Ikan Tongkol', icon: '🐟', kind: 'fish', sell: 65 },
  gurita: { name: 'Gurita', icon: '🐙', kind: 'fish', sell: 140 },
  kerang: { name: 'Kerang Cantik', icon: '🐚', kind: 'gift', sell: 20 },
  bot: { name: 'Sepatu Bot Tua', icon: '👢', kind: 'junk', sell: 1 },
  teh: { name: 'Teh Matcha', icon: '🍵', kind: 'gift', price: 25, sell: 10, desc: 'Hadiah yang menghangatkan' },
  mochi: { name: 'Kue Mochi', icon: '🍡', kind: 'gift', price: 30, sell: 12, desc: 'Manis dan kenyal' },
};

export const CROPS = {
  lobak: { days: 3, yield: 1 },
  tomat: { days: 4, yield: 2 },
  stroberi: { days: 5, yield: 2 },
};

// `diff` (0..1) controls how restless the fish is in the reeling minigame.
export const FISH = [
  { id: 'sarden', weight: 40, diff: .25 },
  { id: 'kakap', weight: 26, diff: .45, morning: 14 },
  { id: 'tongkol', weight: 14, diff: .65 },
  { id: 'gurita', weight: 2, diff: .8, nightOrRain: 12 },
  { id: 'kerang', weight: 4, diff: .1 },
  { id: 'bot', weight: 8, diff: .1 },
];

export const RODS = {
  1: { name: 'Joran Bambu', zone: 28 },
  2: { name: 'Joran Karbon', zone: 38 },
};

export const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
