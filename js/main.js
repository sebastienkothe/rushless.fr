(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('#mobile-menu');
  const menuButton = document.querySelector('.menu-toggle');
  const closeMenu = () => {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Ouvrir le menu');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); }
  });
  document.addEventListener('click', e => {
    if (!menu.hidden && !e.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.08 });
    revealElements.forEach(el => revealObserver.observe(el));
  } else revealElements.forEach(el => el.classList.add('is-visible'));

  const playIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 5h4v14H7zm7 0h4v14h-4z"/></svg>';
  const mutedIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/></svg>';
  const soundIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
  const names = { kalmo: 'Kalmo', solane: 'Maison Solane', ambre: 'Brûlerie Ambre' };
  const status = document.querySelector('#media-status');
  const states = new Map();
  const slots = [...document.querySelectorAll('[data-slot]')];
  document.querySelectorAll('video[data-demo]').forEach(video => {
    const key = video.dataset.demo;
    // No src until visible; only these three video elements ever load a file.
    video.autoplay = false;
    video.removeAttribute('autoplay');
    video.muted = true;
    const state = { key, video, activeSlot: video.parentElement, visible: new Map(), userPaused: false, requested: false };
    states.set(key, state);
    const syncControls = () => {
      document.querySelectorAll(`[data-play="${key}"]`).forEach(button => {
        const playing = !video.paused && button.closest('[data-slot]') === state.activeSlot;
        button.innerHTML = playing ? pauseIcon : playIcon;
        button.setAttribute('aria-label', `${playing ? 'Mettre en pause' : 'Lire'} la démo ${names[key]}`);
        button.setAttribute('aria-pressed', String(playing));
      });
      document.querySelectorAll(`[data-sound="${key}"]`).forEach(button => {
        button.innerHTML = video.muted ? mutedIcon : soundIcon;
        button.setAttribute('aria-label', `${video.muted ? 'Activer' : 'Couper'} le son de la démo ${names[key]}`);
        button.setAttribute('aria-pressed', String(!video.muted));
      });
    };
    state.sync = syncControls;
    video.addEventListener('play', syncControls);
    video.addEventListener('pause', syncControls);
    video.addEventListener('volumechange', syncControls);
    video.addEventListener('error', () => {
      status.textContent = `La démo ${names[key]} ne peut pas être lue. Son aperçu reste disponible.`;
      syncControls();
    });
    syncControls();
  });
  const load = state => {
    if (!state.video.hasAttribute('src')) { state.video.src = state.video.dataset.src; state.video.load(); }
  };
  const play = async state => {
    load(state);
    try {
      await state.video.play();
      if (document.hidden || !(state.visible.get(state.activeSlot) > 0) || state.userPaused || (reduceMotion.matches && !state.requested)) state.video.pause();
    } catch (_) { state.sync(); }
  };
  const refresh = state => {
    let best = null;
    let ratio = 0;
    for (const [slot, visibility] of state.visible) {
      if (visibility > ratio) { ratio = visibility; best = slot; }
    }
    if (!best || document.hidden) {
      state.video.pause();
      // Sound never follows the visitor out of a visible demo.
      state.video.muted = true;
      return;
    }
    if (best !== state.activeSlot) {
      state.video.pause();
      state.video.muted = true;
      best.insertBefore(state.video, best.querySelector('.dynamic-island'));
      state.activeSlot = best;
      state.requested = false;
      state.sync();
    }
    if (!state.userPaused && (!reduceMotion.matches || state.requested)) play(state);
    else state.video.pause();
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const changed = new Set();
      entries.forEach(entry => {
        const state = states.get(entry.target.dataset.key);
        state.visible.set(entry.target, entry.isIntersecting && entry.intersectionRatio >= .2 ? entry.intersectionRatio : 0);
        changed.add(state);
      });
      changed.forEach(refresh);
    }, { threshold: [0, .2, .4, .6, .8, 1] });
    slots.forEach(slot => observer.observe(slot));
  } else {
    slots.forEach(slot => {
      const state = states.get(slot.dataset.key);
      state.visible.set(slot, slot.dataset.zone === 'hero' ? 1 : 0);
    });
    // Without visibility observation, require an explicit playback request.
    states.forEach(state => { state.userPaused = true; });
  }
  document.querySelectorAll('[data-play]').forEach(button => button.addEventListener('click', () => {
    const state = states.get(button.dataset.play);
    const slot = button.closest('[data-slot]');
    if (state.activeSlot === slot && !state.video.paused) {
      state.userPaused = true;
      state.requested = false;
      state.video.pause();
    } else {
      state.userPaused = false;
      state.requested = true;
      if (slot !== state.activeSlot) {
        state.video.pause();
        state.video.muted = true;
        slot.insertBefore(state.video, slot.querySelector('.dynamic-island'));
        state.activeSlot = slot;
      }
      state.visible.set(slot, 1);
      play(state);
    }
    state.sync();
  }));
  document.querySelectorAll('[data-sound]').forEach(button => button.addEventListener('click', () => {
    const state = states.get(button.dataset.sound);
    const slot = button.closest('[data-slot]');
    const wantsSound = state.video.muted;
    states.forEach(other => { other.video.muted = true; });
    if (state.activeSlot !== slot) {
      state.video.pause();
      slot.insertBefore(state.video, slot.querySelector('.dynamic-island'));
      state.activeSlot = slot;
    }
    state.video.muted = !wantsSound;
    if (wantsSound) {
      state.userPaused = false;
      state.requested = true;
      state.visible.set(slot, 1);
      play(state);
    }
    state.sync();
  }));
  document.addEventListener('visibilitychange', () => states.forEach(refresh));
  reduceMotion.addEventListener('change', () => {
    states.forEach(state => {
      state.requested = false;
      state.userPaused = false;
      if (reduceMotion.matches) {
        state.video.pause();
        state.video.muted = true;
        state.video.removeAttribute('src');
        state.video.load();
      }
      refresh(state);
    });
    resetParallax();
  });

  const stage = document.querySelector('.hero-stage');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let mouseX = 0, mouseY = 0, scheduled = false;
  const resetParallax = () => {
    stage.style.removeProperty('--parallax-x');
    stage.style.removeProperty('--parallax-y');
    stage.style.removeProperty('--scroll-y');
  };
  const updateParallax = () => {
    scheduled = false;
    if (reduceMotion.matches) return;
    stage.style.setProperty('--parallax-x', `${mouseX * 7}px`);
    stage.style.setProperty('--parallax-y', `${mouseY * 5}px`);
    const scrollOffset = Math.min(window.scrollY, 700) * (finePointer.matches ? .035 : .014);
    stage.style.setProperty('--scroll-y', `${scrollOffset}px`);
  };
  const scheduleParallax = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateParallax); } };
  stage.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduceMotion.matches) return;
    const rect = stage.getBoundingClientRect();
    mouseX = (event.clientX - rect.left) / rect.width * 2 - 1;
    mouseY = (event.clientY - rect.top) / rect.height * 2 - 1;
    scheduleParallax();
  });
  stage.addEventListener('pointerleave', () => { mouseX = mouseY = 0; scheduleParallax(); });
  window.addEventListener('scroll', scheduleParallax, { passive: true });
})();
