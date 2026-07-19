import { state } from './state.js';

const engineListeners = [];

function flushEngineQueue() {
  if (!state.engine || !state.engineReady || !state.engineMessageQueue) return;
  while (state.engineMessageQueue.length > 0) {
    state.engine.postMessage(state.engineMessageQueue.shift());
  }
}

export function initEngine(onMessage) {
  if (onMessage) engineListeners.push(onMessage);
  if (state.engine) {
    if (state.engineReady) {
      flushEngineQueue();
    }
    return;
  }

  state.engineReady = false;
  state.engineMessageQueue = [];
  state.engine = new Worker('stockfish.js');
  state.engine.addEventListener('message', (event) => {
    const line = event.data;
    // Trace engine worker output without changing move logic.
    if (typeof line === 'string' && (line === 'readyok' || line.startsWith('bestmove') || line.startsWith('info'))) {
      console.log('[stockfish worker] line:', line);
    }
    engineListeners.forEach((listener) => listener(line));
    if (line === 'readyok') {
      state.engineReady = true;
      flushEngineQueue();
    }
  });


  state.engine.postMessage('uci');
  state.engine.postMessage('isready');
}

export function postEngineMessage(message) {
  if (!state.engine) return;
  if (!state.engineReady && message !== 'uci' && message !== 'isready') {
    state.engineMessageQueue.push(message);
    return;
  }
  state.engine.postMessage(message);
}

export function stopEngine() {
  if (state.engine) state.engine.postMessage('stop');
}
