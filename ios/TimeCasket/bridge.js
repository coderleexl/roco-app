/* Page-world transport adapter. No remote debug channel or credential storage. */
(function (win) {
  'use strict';
  const native = win.webkit?.messageHandlers?.timeCasket;
  if (!native || !['https://17roco.qq.com', 'https://web2.17roco.qq.com'].includes(win.location.origin)) return;
  const call = body => native.postMessage(body);
  const decode = value => Uint8Array.from(win.atob(value), c => c.charCodeAt(0));
  const encode = bytes => {
    let text = '';
    for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return win.btoa(text);
  };
  const originalFetch = win.fetch.bind(win);
  function allowedHost(host) {
    return ['dir.17roco.qq.com', 'stat.17roco.qq.com'].includes(host) ||
      (/^zone[1-9][0-9]{0,4}\.17roco\.qq\.com$/.test(host) && Number(host.slice(4).split('.')[0]) <= 65535);
  }
  win.fetch = async function (input, init) {
    const request = new win.Request(input, init);
    const url = new URL(request.url);
    let command;
    if (request.method === 'GET' && url.protocol === 'tc-extension:' && url.hostname === 'runtime') command = {command: 'asset', path: url.pathname.slice(1)};
    if (request.method === 'GET' && url.origin === 'https://res.17roco.qq.com' && !url.username && !url.password &&
        (/^\/(preloader\.swf|main\.swf|ver\.config|Global\.xml|preloadlist\.xml)$/.test(url.pathname) ||
         /^\/(swf|libs|conf|res|plugins|activity|apps|video)\/[A-Za-z0-9_./-]+\.(swf|xml|config|bin|dat|png|jpg|jpeg|gif|webp|mp3|mp4|txt|fint|exbn)$/.test(url.pathname))) command = {command: 'fetch', url: url.href};
    if (!command) return originalFetch(input, init);
    if (request.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const result = await call(command);
    if (request.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const response = new win.Response([101, 204, 205, 304].includes(result.status) ? null : decode(result.data), {status: result.status, headers: {'Content-Type': result.type}});
    Object.defineProperty(response, 'url', {value: request.url});
    return response;
  };
  class NativeSocket extends EventTarget {
    static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
    CONNECTING = 0; OPEN = 1; CLOSING = 2; CLOSED = 3;
    readyState = 0; bufferedAmount = 0; binaryType = 'blob'; extensions = ''; protocol = '';
    onopen = null; onmessage = null; onerror = null; onclose = null;
    constructor(url) {
      super(); this.url = String(url); this.id = win.crypto.randomUUID(); this.queue = Promise.resolve();
      const host = new URL(this.url).hostname;
      if (!allowedHost(host)) throw new DOMException('Destination rejected', 'SecurityError');
      call({command: 'open', host, id: this.id}).then(() => {
        if (this.readyState !== 0) { call({command:'close',id:this.id}).catch(() => {}); return; }
        this.readyState = 1; this.emit(new Event('open')); this.receive();
      }).catch(() => { this.emit(new Event('error')); this.finish(); });
    }
    emit(event) { this.dispatchEvent(event); this['on' + event.type]?.call(this, event); }
    async receive() {
      try {
        while (this.readyState === 1) {
          const item = await call({command: 'receive', id: this.id});
          if (this.readyState !== 1) return;
          if (item.data) {
            const bytes = decode(item.data);
            this.emit(new MessageEvent('message', {data: this.binaryType === 'arraybuffer' ? bytes.buffer : new Blob([bytes])}));
          }
          if (item.closed) break;
        }
      } catch (_) { if (this.readyState === 1) this.emit(new Event('error')); }
      this.finish();
    }
    send(value) {
      if (this.readyState !== 1) throw new DOMException('Socket is not open', 'InvalidStateError');
      const size = value instanceof Blob ? value.size : typeof value === 'string' ? new TextEncoder().encode(value).length : value.byteLength;
      if (size > 1048576 || this.bufferedAmount + size > 4194304) throw new DOMException('Socket queue full', 'QuotaExceededError');
      this.bufferedAmount += size;
      this.queue = this.queue.then(async () => {
        const bytes = value instanceof Blob ? new Uint8Array(await value.arrayBuffer()) : typeof value === 'string' ? new TextEncoder().encode(value) : ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(value);
        if (this.readyState === 1) await call({command: 'send', id: this.id, data: encode(bytes)});
      }).catch(() => { this.emit(new Event('error')); this.close(); }).finally(() => { this.bufferedAmount = Math.max(0, this.bufferedAmount - size); });
    }
    finish() { if (this.readyState === 3) return; this.readyState = 3; this.emit(new CloseEvent('close', {code: 1000, wasClean: false})); }
    close() { if (this.readyState >= 2) return; this.readyState = 2; call({command: 'close', id: this.id}).catch(() => {}).finally(() => this.finish()); }
  }
  const OriginalSocket = win.WebSocket;
  win.WebSocket = new Proxy(OriginalSocket, {construct(target, args, newTarget) {
    let url; try { url = new URL(String(args[0])); } catch (_) { return Reflect.construct(target, args, newTarget); }
    if (url.protocol === 'tc-socket:' && url.port === '' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '') return new NativeSocket(url.href);
    return Reflect.construct(target, args, newTarget);
  }});
  const player = win.RufflePlayer || (win.RufflePlayer = {});
  const config = player.config || (player.config = {});
  config.autoplay = 'on'; config.logLevel = 'error'; config.allowNetworking = 'all';
  Object.defineProperty(config, 'socketProxy', {configurable: true, enumerable: true, get() {
    const hosts = ['dir.17roco.qq.com', 'stat.17roco.qq.com'];
    for (let n = 1; n <= 65535; n++) hosts.push('zone' + n + '.17roco.qq.com');
    const entries = hosts.map(host => ({host, port: 443, proxyUrl: 'tc-socket://' + host}));
    Object.defineProperty(config, 'socketProxy', {value: entries, writable: true, configurable: true, enumerable: true}); return entries;
  }});
})(window);
