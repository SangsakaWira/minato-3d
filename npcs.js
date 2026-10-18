import { scene, groundHeight, blocked } from './world.js';
import { makeCharacter } from './character.js';
import { turnToward } from './player.js';
import { ITEMS, RODS } from './data.js';
import { state, addItem, removeItem, count } from './state.js';
import { ui, esc } from './ui.js';
import { sfx } from './audio.js';

export const NPC_DEFS = [
  {
    id: 'hana', name: 'Hana', role: 'Pemilik kafe',
    look: { shirt: '#e8a3a0', pants: '#5a5f73', hair: '#3a2621', hat: 'bun', apron: '#fffaf0' },
    spot: [-15, 6.4], face: 0, wander: 1,
    loves: ['stroberi'], likes: ['teh', 'tomat', 'kakap', 'kerang'],
    sells: ['teh', 'mochi'], buys: ['crop', 'fish'],
    intro: 'Halo! Kamu yang baru pindah ke rumah di ujung jalan itu, kan? Aku Hana. Kafe kecil ini punyaku. Mampir kapan saja, teh selalu hangat.',
    morning: 'Selamat pagi! Aroma teh pertama hari ini selalu yang paling wangi.',
    night: 'Kafe sudah mau tutup, tapi lampunya kubiarkan menyala sebentar. Indah, ya?',
    rain: 'Hujan begini, kafe jadi hangat dan ramai. Duduklah sebentar.',
    lines: [
      'Ombak hari ini pelan sekali. Cocok untuk duduk lama di teras.',
      'Kalau kamu dapat ikan segar, aku bisa memasaknya jadi sup miso.',
      'Pak Kenji itu kelihatannya galak, tapi dia yang paling sering menolong orang di desa ini.',
      'Yuki suka sekali stroberi. Kalau kebunmu panen, jangan lupakan dia ya.',
    ],
    close: ['Senang sekali kamu pindah ke Minato. Desa ini terasa lebih hidup.', 'Kadang aku menyisakan satu kursi di teras. Untukmu, kalau mampir.'],
    again: 'Ada lagi yang bisa kubantu?',
    react: { love: 'Stroberi! Kamu tahu saja kesukaanku. Terima kasih!', like: 'Wah, terima kasih. Aku suka ini.', neutral: 'Oh, untukku? Terima kasih ya.' },
    quests: [
      {
        need: { sarden: 3 }, reward: { coins: 120 },
        ask: 'Boleh minta tolong? Aku mau bikin sup miso ikan untuk menu baru. Bisa bawakan 3 Ikan Sarden? Biasanya mudah didapat dari dermaga.',
        done: 'Segar sekali! Sup misonya pasti enak. Ini upahmu, terima kasih ya!',
      },
      {
        need: { tomat: 2, kakap: 1 }, reward: { coins: 220, items: { mochi: 2 } },
        ask: 'Menu musim ini: kakap bakar dengan saus tomat. Kalau kebunmu sudah panen, bawakan 2 Tomat dan 1 Ikan Kakap ya?',
        done: 'Sempurna! Ini sebagian hasil penjualan kemarin, dan mochi untuk camilan.',
      },
    ],
  },
  {
    id: 'kenji', name: 'Pak Kenji', role: 'Nelayan',
    look: { shirt: '#3d5a80', pants: '#2d3142', skin: '#d9a77c', hair: '#c9c4bd', hat: 'cap', hatColor: '#f2eddb' },
    spot: [13, -4.1], face: 0, wander: 0,
    loves: ['teh'], likes: ['mochi', 'tongkol', 'gurita'],
    buys: ['fish', 'junk'],
    intro: '…Hm. Orang baru. Aku Kenji. Empat puluh tahun aku melaut dari dermaga ini. Mau memancing? Berdiri di tepi air, hadap ke laut, lempar kailmu. Sisanya, sabar.',
    morning: 'Pagi begini kakap suka mendekat ke dermaga.',
    night: 'Malam begini gurita keluar dari celah batu. Licik mereka.',
    rain: 'Hujan membuat ikan lapar. Hari yang bagus untuk memancing.',
    lines: [
      'Laut tidak bisa dipaksa. Tunggu, dan dia akan memberi.',
      'Jangan tarik terlalu keras. Ikuti gerak ikannya.',
      'Perahu itu sudah setua aku. Masih kuat juga.',
      'Kalau dapat sepatu bot, jangan dibuang ke laut lagi. Kasih saja ke anak itu.',
    ],
    close: ['Kau mulai terlihat seperti orang sini.', 'Dulu anakku juga suka memancing di sini. Sekarang dia di kota.'],
    again: 'Apa lagi?',
    react: { love: 'Teh matcha… Hah. Kau memperhatikan rupanya. Terima kasih.', like: 'Hm. Boleh juga.', neutral: 'Hm. Terima kasih.', junk: 'Sepatu bot… kau bercanda?' },
    quests: [
      {
        need: { kakap: 2 }, reward: { rod: 2 },
        ask: 'Joran bambu itu sudah tua. Tunjukkan kalau kau serius: bawa 2 Ikan Kakap. Nanti kuberi sesuatu.',
        done: 'Lumayan. Ambil joran karbon ini. Lebih ringan, ikan lebih mudah diikuti.',
      },
      {
        need: { gurita: 1 }, reward: { coins: 350 },
        ask: 'Ada gurita besar yang suka sembunyi di bawah dermaga. Keluarnya kalau malam atau hujan. Tangkap kalau bisa.',
        done: 'Ha! Kau menangkapnya! Sudah lama aku tidak tertawa begini. Ini, ambil.',
      },
    ],
  },
  {
    id: 'sato', name: 'Bu Sato', role: 'Petani',
    look: { shirt: '#7a9e5f', pants: '#5b4636', hair: '#8d8478', hat: 'scarf', hatColor: '#f4d58d' },
    spot: [16.6, -9.6], face: Math.PI, wander: .6,
    loves: ['mochi'], likes: ['teh', 'tomat', 'lobak'],
    sells: ['seed_lobak', 'seed_tomat', 'seed_stroberi'], buys: ['crop'],
    intro: 'Selamat datang di Minato! Aku Bu Sato. Lihat petak tanah di sana? Dulu kebun suamiku. Sekarang boleh kamu urus.',
    morning: 'Embun pagi bagus untuk tanaman. Sudah disiram hari ini?',
    night: 'Sudah malam, Nak. Tanaman tumbuh waktu kita tidur, jadi istirahatlah.',
    rain: 'Hujan! Hari ini tidak perlu menyiram. Langit yang mengurus.',
    lines: [
      'Tanah di sini agak asin, tapi lobak justru suka.',
      'Cangkul, tanam, siram, lalu tidur. Begitu terus, sabar saja.',
      'Stroberi butuh lima hari, tapi manisnya sepadan.',
      'Tomat berbuah dua sekaligus. Hana suka sekali tomat dari sini.',
    ],
    close: ['Kebunmu rapi sekali. Suamiku pasti senang melihatnya.', 'Kamu sudah seperti keluarga sendiri.'],
    again: 'Ada lagi, Nak?',
    react: { love: 'Mochi! Aduh, kamu manis sekali. Terima kasih!', like: 'Terima kasih, Nak. Ibu suka.', neutral: 'Wah, terima kasih ya.' },
    quests: [
      {
        need: { lobak: 1 }, reward: { items: { seed_tomat: 4 } },
        ask: 'Petak itu boleh kamu pakai. Cangkul, tanam benih lobak, siram, lalu tidur. Tanaman tumbuh selagi kamu bermimpi. Bawa lobak pertamamu ke sini ya.',
        done: 'Lobak pertama! Selalu yang paling manis. Ini benih tomat, hadiah dari Ibu.',
      },
      {
        need: { tomat: 4 }, reward: { coins: 60, items: { seed_stroberi: 4 } },
        ask: 'Pasar di kota sebelah mencari tomat. Bisa kumpulkan 4 Tomat untuk Ibu?',
        done: 'Terima kasih, Nak. Ini benih stroberi dan sedikit uang.',
      },
    ],
  },
  {
    id: 'yuki', name: 'Yuki', role: 'Anak desa',
    look: { shirt: '#f6bd60', pants: '#84a59d', hair: '#4a3328', hat: 'pigtails', scale: .75 },
    route: [[-13.5, 9], [-12.2, 2], [-11.2, -3.5], [-7.5, -8.6]],
    loves: ['stroberi', 'mochi'], likes: ['kerang', 'bot', 'sarden'],
    intro: 'Hai! Aku Yuki, umurku delapan! Kakak orang baru ya? Mau jadi temanku?',
    morning: 'Pagi, Kak! Aku sudah bangun dari tadi, menghitung burung camar!',
    night: 'Ssst… kalau malam, kadang ada bintang jatuh di atas laut!',
    rain: 'Hujan! Aku suka lompat-lompat di genangan air!',
    lines: [
      'Aku menghitung kapal hari ini! …baru satu sih.',
      'Bu Sato bilang aku boleh bantu menyiram, tapi aku lupa terus.',
      'Aku mau jadi nelayan seperti Pak Kenji!',
      'Kak Hana kadang kasih aku mochi gratis. Rahasia ya!',
    ],
    close: ['Kakak teman terbaikku di Minato!', 'Nanti kalau aku besar, aku mau punya kebun kayak Kakak!'],
    again: 'Terus, terus?',
    react: { love: 'WAAH! Ini kesukaanku! Makasih, Kak!', like: 'Asyik! Makasih, Kak!', neutral: 'Hmm… makasih, Kak.', junk: 'Sepatu bot! Keren, bisa jadi pot bunga!' },
    quests: [
      {
        need: { stroberi: 1 }, reward: { items: { kerang: 1 } },
        ask: 'Kak, aku pengin makan stroberi yang dipetik sendiri… Kalau kebun Kakak panen stroberi, bagi satu ya?',
        done: 'Manis bangeeet! Ini, aku menemukan kerang cantik di pantai. Buat Kakak!',
      },
      {
        need: { bot: 1 }, reward: { coins: 80 },
        ask: 'Aku mau bikin pot bunga dari sepatu bot! Kalau Kakak memancing dapat sepatu bot, kasih aku ya!',
        done: 'Yeay! Nanti kutanami bunga matahari. Ini tabunganku, hehe.',
      },
    ],
  },
];

// --- Friendship and quests ------------------------------------------------------

export const hearts = id => Math.min(5, Math.floor((state.friend[id] ?? 0) / 20));
const addFriend = (id, n) => { state.friend[id] = Math.max(0, Math.min(100, (state.friend[id] ?? 0) + n)); };
const questState = id => (state.quests[id] ??= { i: 0, active: false });
export const questFor = def => def.quests?.[questState(def.id).i] ?? null;
export const isQuestActive = def => questState(def.id).active;
export const canDeliver = q => Object.entries(q.need).every(([id, n]) => count(id) >= n);
export const needText = q => Object.entries(q.need).map(([id, n]) => `${n}× ${ITEMS[id].name}`).join(', ');

// '!' = new request waiting, '★' = request can be completed.
export function questMarker(def) {
  const q = questFor(def);
  if (!q) return '';
  if (!isQuestActive(def)) return '!';
  return canDeliver(q) ? '★' : '';
}

function giveReward(r) {
  const got = [];
  if (r.coins) { state.coins += r.coins; got.push(`${r.coins} koin`); }
  for (const [id, n] of Object.entries(r.items ?? {})) { addItem(id, n); got.push(`${n}× ${ITEMS[id].name}`); }
  if (r.rod) { state.rod = r.rod; got.push(RODS[r.rod].name); }
  ui.toast('Dapat: ' + got.join(', '), '🎁');
  sfx.coin();
}

function pickLine(def) {
  const m = state.minutes, roll = Math.random();
  if (state.weather === 'hujan' && roll < .4) return def.rain;
  if (m < 600 && roll < .5) return def.morning;
  if (m >= 1140 && roll < .6) return def.night;
  const pool = hearts(def.id) >= 3 ? [...def.lines, ...def.close] : def.lines;
  return pool[Math.floor(Math.random() * pool.length)];
}

// --- Shop and gift panels -------------------------------------------------------

const itemRow = (id, extra, button) => {
  const it = ITEMS[id];
  return `<div class="row"><span class="ic">${it.icon}</span><span class="nm">${esc(it.name)}<small>${esc(extra)}</small></span>${button}</div>`;
};

function buyPanel(def) {
  return ui.panel(`Toko ${def.name}`, body => {
    const render = () => {
      body.innerHTML = `<p class="muted">Koinmu: <b>${state.coins}</b></p>` + def.sells.map(id => {
        const it = ITEMS[id];
        return itemRow(id, `${it.desc ?? ''} · punya ${count(id)}`, `<button class="btn" data-id="${id}" ${state.coins < it.price ? 'disabled' : ''}>Beli · ${it.price}</button>`);
      }).join('');
      body.querySelectorAll('[data-id]').forEach(b => {
        b.onclick = () => {
          const it = ITEMS[b.dataset.id];
          if (state.coins < it.price) return;
          state.coins -= it.price;
          addItem(b.dataset.id);
          sfx.coin();
          render();
        };
      });
    };
    render();
  });
}

function sellPanel(def) {
  return ui.panel(`Jual ke ${def.name}`, body => {
    const render = () => {
      const ids = Object.keys(state.inv).filter(id => def.buys.includes(ITEMS[id]?.kind) && count(id) > 0);
      body.innerHTML = `<p class="muted">Koinmu: <b>${state.coins}</b></p>` + (ids.length
        ? ids.map(id => itemRow(id, `${ITEMS[id].sell} koin · punya ${count(id)}`, `<span class="btns"><button class="btn" data-id="${id}" data-n="1">Jual 1</button><button class="btn ghost" data-id="${id}" data-n="all">Semua</button></span>`)).join('')
        : '<p class="empty">Belum ada barang yang bisa dijual di sini.</p>');
      body.querySelectorAll('[data-id]').forEach(b => {
        b.onclick = () => {
          const id = b.dataset.id, n = b.dataset.n === 'all' ? count(id) : 1;
          removeItem(id, n);
          state.coins += ITEMS[id].sell * n;
          sfx.coin();
          render();
        };
      });
    };
    render();
  });
}

function giftPanel(def) {
  return ui.panel(`Hadiah untuk ${def.name}`, (body, close) => {
    const ids = Object.keys(state.inv).filter(id => ITEMS[id]?.kind !== 'seed' && count(id) > 0);
    body.innerHTML = ids.length
      ? '<p class="muted">Satu hadiah per hari. Setiap orang punya kesukaan sendiri.</p>' + ids.map(id => itemRow(id, `punya ${count(id)}`, `<button class="btn" data-id="${id}">Beri</button>`)).join('')
      : '<p class="empty">Tasmu belum berisi sesuatu yang bisa dijadikan hadiah.</p>';
    body.querySelectorAll('[data-id]').forEach(b => { b.onclick = () => close(b.dataset.id); });
  });
}

// --- Conversation -----------------------------------------------------------------

export async function talk(npc) {
  const def = npc.def;
  npc.talking = true;
  const say = (text, choices) => ui.dialog({ name: def.name, role: def.role, hearts: hearts(def.id), text, choices });

  const queue = [];
  if (!state.met[def.id]) { state.met[def.id] = true; queue.push(def.intro); } else queue.push(pickLine(def));
  if (!state.talked[def.id]) { state.talked[def.id] = true; addFriend(def.id, 4); }
  const q = questFor(def);
  if (q && !isQuestActive(def)) {
    queue.push(q.ask);
    questState(def.id).active = true;
    ui.toast(`Permintaan baru dari ${def.name}`, '📜');
  }
  for (const line of queue.slice(0, -1)) await say(line, [{ label: 'Lanjut', value: 'next' }]);

  let message = queue.at(-1);
  for (;;) {
    const quest = questFor(def), choices = [];
    if (quest && isQuestActive(def) && canDeliver(quest)) choices.push({ label: `Serahkan ${needText(quest)}`, value: 'deliver' });
    if (def.sells) choices.push({ label: 'Beli', value: 'buy' });
    if (def.buys) choices.push({ label: 'Jual', value: 'sell' });
    if (!state.gifted[def.id]) choices.push({ label: 'Beri hadiah', value: 'gift' });
    choices.push({ label: 'Sampai jumpa', value: 'bye' });

    const pick = await say(message, choices);
    if (pick === 'bye') break;
    message = def.again;
    if (pick === 'deliver') {
      for (const [id, n] of Object.entries(quest.need)) removeItem(id, n);
      const qs = questState(def.id);
      qs.i++;
      qs.active = false;
      addFriend(def.id, 12);
      giveReward(quest.reward);
      message = quest.done;
    } else if (pick === 'buy') {
      await buyPanel(def);
    } else if (pick === 'sell') {
      await sellPanel(def);
    } else if (pick === 'gift') {
      const id = await giftPanel(def);
      if (id) {
        removeItem(id);
        state.gifted[def.id] = true;
        const kind = def.loves.includes(id) ? 'love' : def.likes.includes(id) ? 'like' : ITEMS[id].kind === 'junk' ? 'junk' : 'neutral';
        addFriend(def.id, { love: 20, like: 10, neutral: 4, junk: 0 }[kind]);
        message = def.react[kind] ?? def.react.neutral;
        if (kind === 'love' || kind === 'like') sfx.harvest();
      }
    }
  }
  npc.talking = false;
}

// --- Bodies in the world ---------------------------------------------------------

export function createNPCs() {
  const list = NPC_DEFS.map(def => {
    const char = makeCharacter(def.look);
    scene.add(char.root);
    const [x, z] = def.route ? def.route[0] : def.spot;
    char.root.position.set(x, groundHeight(x, z) ?? 1.5, z);
    return { def, char, pos: char.root.position, heading: def.face ?? 0, target: null, wait: 1 + Math.random() * 3, leg: 0, dir: 1, walk: 0, phase: 0, talking: false };
  });

  function nextTarget(n) {
    const { route, spot, wander } = n.def;
    if (route) {
      if (n.leg + n.dir < 0 || n.leg + n.dir >= route.length) n.dir *= -1;
      n.leg += n.dir;
      return { x: route[n.leg][0], z: route[n.leg][1] };
    }
    if (!wander) return null;
    const a = Math.random() * Math.PI * 2, r = Math.random() * wander;
    const x = spot[0] + Math.cos(a) * r, z = spot[1] + Math.sin(a) * r;
    return groundHeight(x, z) !== null && !blocked(x, z, .3) ? { x, z } : null;
  }

  function update(dt, player) {
    for (const n of list) {
      const dx = player.x - n.pos.x, dz = player.z - n.pos.z, near = dx * dx + dz * dz < 6.25;
      let moving = false;
      if (n.talking || near) {
        n.heading = turnToward(n.heading, Math.atan2(dx, dz), dt * 6);
      } else if (n.target) {
        const tx = n.target.x - n.pos.x, tz = n.target.z - n.pos.z, d = Math.hypot(tx, tz);
        if (d < .1) {
          n.target = null;
          n.wait = n.def.route ? 2 + Math.random() * 4 : 3 + Math.random() * 5;
        } else {
          const step = Math.min(d, (n.def.route ? 1.5 : 1) * dt);
          n.pos.x += tx / d * step;
          n.pos.z += tz / d * step;
          n.heading = turnToward(n.heading, Math.atan2(tx, tz), dt * 8);
          moving = true;
        }
      } else if ((n.wait -= dt) <= 0) {
        n.target = nextTarget(n);
        n.wait = 2;
      } else if (n.def.face !== undefined) {
        n.heading = turnToward(n.heading, n.def.face, dt * 2);
      }
      const h = groundHeight(n.pos.x, n.pos.z);
      if (h !== null) n.pos.y += (h - n.pos.y) * Math.min(1, dt * 12);
      n.walk += ((moving ? 1 : 0) - n.walk) * Math.min(1, dt * 8);
      n.phase += dt * 9 * n.walk;
      n.char.root.rotation.y = n.heading;
      n.char.pose(n.phase, n.walk);
    }
  }

  return { list, update };
}
