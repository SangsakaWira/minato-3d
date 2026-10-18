import { sfx } from './audio.js';

const $ = s => document.querySelector(s);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const wait = ms => new Promise(r => setTimeout(r, ms));
const isConfirmKey = k => k === 'Enter' || k === ' ' || k === 'e' || k === 'E';

// Number of open dialogs/panels/fades. While > 0 the world clock and player pause.
let modal = 0;
const last = {};
function setText(el, key, value) {
  if (last[key] === value) return;
  last[key] = value;
  el.textContent = value;
}

export const ui = {
  get busy() { return modal > 0; },

  toast(text, icon = '') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = icon ? `<span>${icon}</span>${esc(text)}` : esc(text);
    const box = $('#toasts');
    box.append(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => el.classList.add('out'), 3000);
    setTimeout(() => el.remove(), 3500);
  },

  hud({ day, time, weather, coins }) {
    setText($('#hudDay'), 'day', day);
    setText($('#hudTime'), 'time', time);
    setText($('#hudWeather'), 'weather', weather);
    setText($('#hudCoins'), 'coins', coins);
  },

  // slots: [{ id, icon, name, count }]
  hotbar(slots, selected, onSelect) {
    const key = JSON.stringify([slots, selected]);
    if (last.hotbar === key) return;
    last.hotbar = key;
    const bar = $('#hotbar');
    bar.hidden = !slots.length;
    bar.innerHTML = slots.map((s, i) => `<button class="slot${s.id === selected ? ' on' : ''}" data-id="${s.id}" title="${esc(s.name)}"><kbd>${i + 1}</kbd><span class="ic">${s.icon}</span><small>${esc(s.name.replace('Benih ', ''))}</small><b>${s.count}</b></button>`).join('');
    bar.querySelectorAll('.slot').forEach(b => { b.onclick = () => onSelect(b.dataset.id); });
  },

  action(info) {
    const btn = $('#action');
    const label = info ? info.label : '';
    if (last.action === label + !!info?.disabled) return;
    last.action = label + !!info?.disabled;
    btn.hidden = !info;
    btn.classList.toggle('disabled', !!info?.disabled);
    $('#actionLabel').textContent = label;
  },

  dialog({ name, role = '', hearts = null, text, choices }) {
    modal++;
    const box = $('#dialog'), textEl = $('#dlgText'), choicesEl = $('#dlgChoices');
    box.hidden = false;
    $('#dlgName').textContent = name;
    $('#dlgRole').textContent = role;
    $('#dlgHearts').textContent = hearts === null ? '' : '♥'.repeat(hearts) + '♡'.repeat(5 - hearts);
    choicesEl.innerHTML = '';
    textEl.textContent = '';
    const opened = performance.now(), chars = [...text];
    return new Promise(resolve => {
      let shown = 0, typing = true, closed = false;
      const timer = setInterval(() => {
        shown += 2;
        textEl.textContent = chars.slice(0, shown).join('');
        if (shown % 6 === 0) sfx.talk();
        if (shown >= chars.length) finishTyping();
      }, 28);
      function finishTyping() {
        if (!typing) return;
        typing = false;
        clearInterval(timer);
        textEl.textContent = text;
        choices.forEach((c, i) => {
          const b = document.createElement('button');
          b.className = 'choice';
          b.innerHTML = `<kbd>${i + 1}</kbd>${esc(c.label)}`;
          b.onclick = e => { e.stopPropagation(); done(c.value); };
          choicesEl.append(b);
        });
      }
      function done(value) {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        document.removeEventListener('keydown', onKey, true);
        box.removeEventListener('click', onClick);
        box.hidden = true;
        modal--;
        sfx.ui();
        resolve(value);
      }
      function onKey(e) {
        e.stopImmediatePropagation();
        if (e.repeat || performance.now() - opened < 180) return;
        if (typing) { if (isConfirmKey(e.key)) { e.preventDefault(); finishTyping(); } return; }
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= choices.length) done(choices[n - 1].value);
        else if (isConfirmKey(e.key) && choices.length === 1) { e.preventDefault(); done(choices[0].value); }
        else if (e.key === 'Escape') { const out = choices.find(c => c.value === 'bye' || c.value === 'no'); if (out) done(out.value); }
      }
      function onClick() { if (typing) finishTyping(); }
      document.addEventListener('keydown', onKey, true);
      box.addEventListener('click', onClick);
    });
  },

  // render(body, close) fills the panel; resolves with whatever close() receives.
  panel(title, render, toggleKey = null) {
    modal++;
    const el = $('#panel'), body = $('#panelBody');
    el.hidden = false;
    $('#panelTitle').textContent = title;
    body.innerHTML = '';
    const opened = performance.now();
    return new Promise(resolve => {
      let closed = false;
      const close = value => {
        if (closed) return;
        closed = true;
        el.hidden = true;
        modal--;
        document.removeEventListener('keydown', onKey, true);
        el.onclick = null;
        resolve(value);
      };
      const onKey = e => {
        e.stopImmediatePropagation();
        if (performance.now() - opened < 150) return;
        if (e.key === 'Escape' || (toggleKey && e.key.toLowerCase() === toggleKey)) close();
      };
      document.addEventListener('keydown', onKey, true);
      $('#panelClose').onclick = () => close();
      el.onclick = e => { if (e.target === el) close(); };
      render(body, close);
    });
  },

  async fade(text) {
    modal++;
    const el = $('#fade');
    el.querySelector('p').textContent = text;
    el.classList.add('on');
    await wait(900);
  },
  async unfade() {
    $('#fade').classList.remove('on');
    await wait(700);
    modal--;
  },

  banner(title, sub = '') {
    const el = $('#banner');
    el.querySelector('b').textContent = title;
    el.querySelector('span').textContent = sub;
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
  },

  fish: {
    show(hint) {
      $('#fish').hidden = false;
      $('#fishHint').textContent = hint;
    },
    render(zoneLeft, zoneWidth, fishX, progress) {
      $('#fishZone').style.cssText = `left:${zoneLeft}%;width:${zoneWidth}%`;
      $('#fishIcon').style.left = fishX + '%';
      $('#fishFill').style.width = Math.round(progress * 100) + '%';
      $('#fish').classList.toggle('hit', fishX >= zoneLeft && fishX <= zoneLeft + zoneWidth);
    },
    hide() { $('#fish').hidden = true; },
  },
};
