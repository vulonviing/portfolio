const LOCAL_ORIGINS = ['http://127.0.0.1:8765', 'http://localhost:8765'];
const RESPONSE_TIMEOUT_MS = 20000;

export function createPresenterBridge(browserWindow, callbacks = {}) {
  const { onPairChange = () => {}, onReset = () => {}, onKeyChange = () => {} } = callbacks;
  const controller = browserWindow.opener || null;
  const pending = new Map();
  let origin = null;
  let helloTimer = null;

  function handleMessage(event) {
    if (event.source !== controller || !controller || !LOCAL_ORIGINS.includes(event.origin)) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'seds-presenter-paired') {
      origin = event.origin;
      onPairChange(true);
    } else if (data.type === 'seds-presenter-response' && pending.has(data.requestId)) {
      const request = pending.get(data.requestId);
      pending.delete(data.requestId);
      browserWindow.clearTimeout(request.timeout);
      if (data.ok) request.resolve(data.state);
      else request.reject(new Error(data.error || 'Voting command failed'));
    } else if (data.type === 'seds-presenter-reset') {
      onReset();
    } else if (data.type === 'seds-presenter-key') {
      onKeyChange(Boolean(data.on));
    }
  }

  function announce() {
    if (!controller || controller.closed) return;
    for (const localOrigin of LOCAL_ORIGINS) {
      controller.postMessage({ type: 'seds-presenter-ready' }, localOrigin);
    }
  }

  function watchController() {
    if (controller && controller.closed && origin) {
      origin = null;
      onPairChange(false);
    }
  }

  return {
    start() {
      if (!controller) return;
      browserWindow.addEventListener('message', handleMessage);
      // Keep announcing so a reloaded local panel re-pairs without reopening this tab.
      announce();
      helloTimer = browserWindow.setInterval(() => { watchController(); announce(); }, 3000);
    },
    stop() {
      browserWindow.clearInterval(helloTimer);
      browserWindow.removeEventListener('message', handleMessage);
      for (const request of pending.values()) {
        browserWindow.clearTimeout(request.timeout);
        request.reject(new Error('Presenter connection closed'));
      }
      pending.clear();
      origin = null;
      onPairChange(false);
    },
    command(action, pollKey) {
      if (!origin || !controller || controller.closed) {
        return Promise.reject(new Error('Open the live presentation from the local management panel'));
      }
      if (!['open', 'close'].includes(action)) {
        return Promise.reject(new Error('Unsupported voting command'));
      }
      const requestId = browserWindow.crypto.randomUUID();
      return new Promise((resolve, reject) => {
        const timeout = browserWindow.setTimeout(() => {
          pending.delete(requestId);
          reject(new Error('Presenter command timed out'));
        }, RESPONSE_TIMEOUT_MS);
        pending.set(requestId, { resolve, reject, timeout });
        controller.postMessage({ type: 'seds-presenter-command', requestId, action, pollKey }, origin);
      });
    },
  };
}
