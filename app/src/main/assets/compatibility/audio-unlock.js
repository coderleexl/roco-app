/* Resume suspended Web Audio only after an actual user gesture on official pages. */
(function () {
  'use strict';
  const page = new URL(window.location.href);
  if (page.username || page.password) return;
  const home = page.origin === 'https://17roco.qq.com' && ['/', '/default.html'].includes(page.pathname);
  if (!home && page.origin !== 'https://web2.17roco.qq.com') return;
  const Original = window.AudioContext;
  if (typeof Original !== 'function' || window.__timeCasketAudioState) return;
  const contexts = new Set();
  let gestureSeen = false;
  const resume = Original.prototype.resume;
  const state = {created: 0, running: 0, suspended: 0, closed: 0, attempts: 0, rejected: 0};
  window.__timeCasketAudioState = state;
  function snapshot() {
    state.running = state.suspended = state.closed = 0;
    for (const context of contexts) {
      if (context.state === 'running') state.running++;
      if (context.state === 'suspended') state.suspended++;
      if (context.state === 'closed') { state.closed++; contexts.delete(context); }
    }
  }
  function unlock() {
    if (!gestureSeen && !window.navigator.userActivation?.hasBeenActive) return;
    for (const context of contexts) {
      if (context.state !== 'suspended') continue;
      state.attempts = Math.min(1000, state.attempts + 1);
      try {
        Promise.resolve(Reflect.apply(resume, context, [])).then(snapshot, () => {
          state.rejected = Math.min(1000, state.rejected + 1); snapshot();
        });
      } catch (_) { state.rejected = Math.min(1000, state.rejected + 1); }
    }
    snapshot();
  }
  window.AudioContext = new Proxy(Original, {
    construct(target, args, newTarget) {
      const context = Reflect.construct(target, args, newTarget);
      snapshot();
      if (contexts.size < 16) {
        contexts.add(context);
        state.created = Math.min(1000, state.created + 1);
        context.addEventListener('statechange', snapshot);
        snapshot();
        // Ruffle may create its context after the user's first click.
        Promise.resolve().then(unlock);
      }
      return context;
    }
  });
  for (const type of ['pointerup', 'touchend', 'click', 'keydown']) {
    window.addEventListener(type, event => {
      if (!event.isTrusted) return;
      gestureSeen = true;
      unlock();
    }, {capture: true, passive: true});
  }
})();
