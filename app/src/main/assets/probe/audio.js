/* Fixed local fixture only. Diagnostics contain enum names and bounded counts. */
(function () {
  'use strict';
  const status = document.getElementById('status');
  const contexts = new Set();
  let webContext, player, busy = false, bufferStarts = 0, nonzeroBuffers = 0, active = true;
  function report(event, value = 0) {
    if (active) fetch('/audio-event?event=' + event + '&value=' + Math.min(1000, Math.max(0, value))).catch(() => {});
  }
  function code(error) {
    return ({NotAllowedError: 1, SecurityError: 2, TypeError: 3, NetworkError: 4, TimeoutError: 5})[error?.name] || 0;
  }
  function states() {
    report('audio-context-running', [...contexts].filter(c => c.state === 'running').length);
    report('audio-context-suspended', [...contexts].filter(c => c.state === 'suspended').length);
  }
  function resume() {
    for (const context of contexts) if (context.state === 'suspended') {
      Promise.resolve(context.resume()).then(states, error => report('audio-resume-failed', code(error)));
    }
  }
  const Original = window.AudioContext;
  window.AudioContext = new Proxy(Original, {construct(target, args, newTarget) {
    const context = Reflect.construct(target, args, newTarget);
    if (contexts.size < 16) {
      contexts.add(context);
      report('audio-context-created', contexts.size);
      context.addEventListener('statechange', states);
      const create = context.createBufferSource;
      context.createBufferSource = function (...args) {
        const source = Reflect.apply(create, this, args), start = source.start;
        source.start = function (...args) {
          const result = Reflect.apply(start, this, args);
          bufferStarts++;
          if (bufferStarts <= 2) report('audio-buffer-started', bufferStarts);
          // Inspect only this original local fixture. Never export sample data.
          try {
            const buffer = this.buffer;
            let nonzero = false;
            for (let channel = 0; buffer && channel < Math.min(2, buffer.numberOfChannels) && !nonzero; channel++) {
              const samples = buffer.getChannelData(channel), stride = Math.max(1, Math.floor(samples.length / 64));
              for (let i = 0; i < samples.length; i += stride) if (Math.abs(samples[i]) > .00001) { nonzero = true; break; }
            }
            if (nonzero && ++nonzeroBuffers === 1) report('audio-buffer-nonzero', 1);
          } catch (_) {}
          return result;
        };
        return source;
      };
      if (window.navigator.userActivation?.hasBeenActive) Promise.resolve().then(resume);
      states();
    }
    return context;
  }});
  window.addEventListener('click', event => { if (event.isTrusted) resume(); }, {capture: true});
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function until(predicate, milliseconds) {
    for (let elapsed = 0; active && elapsed < milliseconds; elapsed += 100) {
      const value = predicate(); if (value) return value;
      await delay(100);
    }
    const error = new Error(); error.name = 'TimeoutError'; throw error;
  }
  document.getElementById('web').onclick = async () => {
    try {
      webContext = webContext || new window.AudioContext(); await webContext.resume();
      const tone = webContext.createOscillator(), gain = webContext.createGain();
      tone.frequency.value = 660; gain.gain.setValueAtTime(0, webContext.currentTime);
      gain.gain.linearRampToValueAtTime(.18, webContext.currentTime + .02); gain.gain.linearRampToValueAtTime(0, webContext.currentTime + .5);
      tone.connect(gain).connect(webContext.destination); tone.start(); tone.stop(webContext.currentTime + .5);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
      document.title = webContext.state === 'running' ? 'ROCO:audio-web-running' : 'ROCO:audio-web-blocked';
      report('audio-web-running', webContext.state === 'running' ? 1 : 0);
      status.textContent = '浏览器提示音已请求播放，请以实际听到为准';
    } catch (error) { report('audio-web-failed', code(error)); status.textContent = '浏览器声音启动失败'; }
  };
  document.getElementById('flash').onclick = async () => {
    if (busy) return;
    busy = true; report('audio-flash-request'); status.textContent = '正在准备 Flash 播放器…';
    try {
      report('audio-source-wait');
      const ruffle = await until(() => window.RufflePlayer?.newest?.(), 20000);
      if (!player) { player = ruffle.createPlayer(); document.getElementById('movie').appendChild(player); report('audio-flash-created'); }
      const api = player.ruffle(), before = nonzeroBuffers;
      status.textContent = '正在加载 Flash 提示音…'; report('audio-flash-loading');
      // Start load without awaiting its promise indefinitely; readiness has a deadline.
      let failure;
      Promise.resolve(api.load({url: new URL('audio.swf', window.location.href).href, autoplay: 'on', allowScriptAccess: false, preferredRenderer: 'webgl'})).catch(error => { failure = error; });
      await until(() => { if (failure) throw failure; return api.readyState === 2; }, 20000);
      report('audio-flash-ready');
      await until(() => nonzeroBuffers > before, 5000);
      document.title = 'ROCO:audio-flash-started'; report('audio-flash-started'); states();
      status.textContent = 'Flash 已产生音频信号，请以实际听到为准';
    } catch (error) {
      report(error?.name === 'TimeoutError' ? 'audio-flash-timeout' : 'audio-flash-failed', code(error));
      status.textContent = 'Flash 提示音未完成，已记录失败阶段';
      player?.remove(); player = null;
    } finally { busy = false; }
  };
  window.addEventListener('error', () => report('audio-script-error'));
  window.addEventListener('pagehide', () => { active = false; for (const context of contexts) context.close(); }, {once: true});
  document.title = 'ROCO:audio-ready'; report('audio-page-ready');
})();
