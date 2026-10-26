(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('#mobile-menu');
  const toggle = document.querySelector('.menu-toggle');
  const closeMenu = (restore = false) => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Ouvrir le menu'); if (restore) toggle.focus(); };
  toggle.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu'); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) closeMenu(true); });
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('.site-header')) closeMenu(); });
  matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .05 }); reveals.forEach(el => io.observe(el)); } else reveals.forEach(el => el.classList.add('is-visible'));
  const playIcon = '<svg class="media-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg>';
  const pauseIcon = '<svg class="media-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  const status = document.querySelector('#media-status');
  const reels = [...document.querySelectorAll('.reel[data-video]')];
  const reelVisibility = new Map();
  const refreshReels = () => reels.forEach(reel => {
    const video = reel.querySelector('video');
    const button = reel.querySelector('button');
    const active = !document.hidden && !reel.dataset.paused && !(reduce.matches && !reel.dataset.started) && reelVisibility.get(reel) !== false;
    if (active) { const p = video.play(); if (p) p.catch(() => {}); } else video.pause();
    button.parentElement.hidden = false;
    button.innerHTML = active ? pauseIcon : playIcon;
    button.setAttribute('aria-pressed', String(!!active));
    button.setAttribute('aria-label', `${active ? 'Mettre en pause' : 'Lire'} la vidéo ${reel.dataset.name}`);
  });
  reels.forEach(reel => reel.querySelector('button').addEventListener('click', () => { const playing = !reel.querySelector('video').paused; if (playing) reel.dataset.paused = 'true'; else { delete reel.dataset.paused; reel.dataset.started = 'true'; } status.textContent = reel.dataset.paused ? 'Vidéo en pause.' : 'Vidéo en lecture.'; refreshReels(); }));
  if ('IntersectionObserver' in window) { const observer = new IntersectionObserver(entries => { entries.forEach(e => reelVisibility.set(e.target, e.isIntersecting && e.intersectionRatio >= .2)); refreshReels(); }, { threshold:[0,.2,.8] }); reels.forEach(reel => observer.observe(reel)); }
  refreshReels();
  document.addEventListener('visibilitychange', refreshReels);
  reduce.addEventListener('change', refreshReels);
  const search = document.querySelector('#zone-search');
  if (search) {
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const items = [...document.querySelectorAll('#par-ville [data-search]')];
    search.addEventListener('input', () => {
      const words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
      let count = 0;
      items.forEach(item => { item.hidden = !words.every(word => normalize(item.dataset.search).includes(word)); if (!item.hidden) count++; });
      document.querySelectorAll('.city-group').forEach(group => { group.hidden = !group.querySelector('[data-search]:not([hidden])'); });
      document.querySelector('#zone-count').textContent = `${count} page${count > 1 ? 's' : ''} locale${count > 1 ? 's' : ''}`;
      document.querySelector('#no-results').hidden = count !== 0;
    });
  }
})();
