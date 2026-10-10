'use strict';

/* ============================================================
   Portofolio — fixed version (no edit mode)
   Fullscreen presentation engine only.
   ============================================================ */

const SECTIONS = ['home', 'about', 'exp', 'work', 'services', 'contact'];
const HUD_NAMES = ['Home', 'About', 'Experience', 'Work', 'Services', 'Contact'];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- Static photos (files, no editing) ---------- */
const PHOTOS = {
  hero: 'assets/hero.jpg',
  portrait: 'assets/photo.jpg',
  work0: 'assets/work-vlookup.jpg',
  work1: 'assets/work-reports.jpg',
  work2: 'assets/work-extrafooding.jpg',
};

function applyPhotos() {
  $$('[data-bg]').forEach(el => {
    const v = PHOTOS[el.dataset.bg];
    el.style.backgroundImage = v ? `url("${v}")` : '';
  });
}

/* ============================================================
   PRESENTATION ENGINE
   ============================================================ */
const sectionEls = SECTIONS.map(id => $('#s-' + id));
let idx = 0;
let lock = false;

function updateNav() {
  $$('.dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  $('#hud-num').textContent = String(idx + 1).padStart(2, '0');
  $('#hud-name').textContent = HUD_NAMES[idx];
  $('#progress-bar').style.transform = `scaleX(${(idx + 1) / SECTIONS.length})`;
}

function goTo(n) {
  n = clamp(n, 0, SECTIONS.length - 1);
  if (n === idx) return;
  const dir = n > idx ? 1 : -1;
  const prev = sectionEls[idx];
  const next = sectionEls[n];

  prev.classList.remove('active');
  prev.style.setProperty('--to', dir > 0 ? '-54px' : '54px');
  prev.classList.add('leaving');

  next.classList.remove('leaving');
  next.style.setProperty('--from', dir > 0 ? '70px' : '-70px');
  void next.offsetWidth; // force reflow so the enter transition runs
  next.classList.add('active');

  idx = n;
  updateNav();
  if (SECTIONS[n] === 'about') animateStats();

  setTimeout(() => prev.classList.remove('leaving'), 950);
}

function animateStats() {
  $$('#s-about .stat-num').forEach(el => {
    const txt = el.textContent.trim();
    const m = txt.match(/^(\d+)(\D*)$/);
    if (!m) return;
    const target = parseInt(m[1], 10); const suffix = m[2];
    const t0 = performance.now(); const dur = 1100;
    const tick = (t) => {
      const p = clamp((t - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0' + suffix;
    requestAnimationFrame(tick);
  });
}

/* Staggered reveal indexes */
SECTIONS.forEach((_, si) => {
  $$('#s-' + SECTIONS[si] + ' [data-reveal]').forEach((el, i) => el.style.setProperty('--i', i));
});

/* ---------- Navigation input ---------- */
window.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaY) < 10) return;
  const sec = sectionEls[idx];
  if (sec.scrollHeight > sec.clientHeight + 4) {
    const atTop = sec.scrollTop <= 1;
    const atBottom = sec.scrollTop + sec.clientHeight >= sec.scrollHeight - 2;
    if (!(e.deltaY > 0 && atBottom) && !(e.deltaY < 0 && atTop)) return;
  }
  if (lock) return;
  lock = true; setTimeout(() => lock = false, 900);
  goTo(idx + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });

let touchY = null;
window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchend', (e) => {
  if (touchY == null) return;
  const dy = touchY - e.changedTouches[0].clientY;
  touchY = null;
  if (Math.abs(dy) > 60) goTo(idx + (dy > 0 ? 1 : -1));
}, { passive: true });

document.addEventListener('keydown', (e) => {
  const k = e.key;
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(k)) { e.preventDefault(); goTo(idx + 1); }
  else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(k)) { e.preventDefault(); goTo(idx - 1); }
  else if (k === 'Home') { e.preventDefault(); goTo(0); }
  else if (k === 'End') { e.preventDefault(); goTo(SECTIONS.length - 1); }
  else if (k.toLowerCase() === 'f') { e.preventDefault(); toggleFullscreen(); }
});

/* Buttons & dots */
document.addEventListener('click', (e) => {
  const goto = e.target.closest('[data-goto]');
  if (goto) {
    e.preventDefault();
    goTo(parseInt(goto.dataset.goto, 10));
  }
});

/* ---------- Fullscreen ---------- */
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
}
$('#btn-fs').addEventListener('click', toggleFullscreen);

/* ---------- Init ---------- */
window.addEventListener('load', () => setTimeout(() => $('#loader').classList.add('done'), 500));
setTimeout(() => $('#loader').classList.add('done'), 1800); // safety net

applyPhotos();
updateNav();
