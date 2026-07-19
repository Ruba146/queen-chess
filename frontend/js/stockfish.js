import { state } from './state.js';

// Strict dual-engine Stockfish workers.
// Each engine has its own:
// - Worker instance
// - ready flag + message queue
// - listeners list (no cross-engine dispatch)
// - in-flight request id (single-flight bestmove)

const engineState = {
  gameEngine: {
    worker: null,
    ready: false,
    queue: [],
    listeners: [],
    inFlightId: 0,
    lastBestmove: null
  },
  analysisEngine: {
    worker: null,
    ready: false,
    queue: [],
    listeners: [],
    inFlightId: 0,
    lastBestmove: null
  }
};

function getEngineKey(engineType) {
  if (engineType === 'game') return 'gameEngine';
  if (engineType === 'analysis') return 'analysisEngine';
  return 'gameEngine';
}

function ensureEngine(engineType) {
  const key = getEngineKey(engineType);
  const es = engineState[key];
  if (es.worker) return es;

  es.ready = false;
  es.queue = [];

  // Worker path must be resolvable relative to the compiled site.
  // Existing code already uses `new Worker('stockfish.js')`, preserve it.
  es.worker = new Worker('stockfish.js');

  es.worker.addEventListener('message', (event) => {
    const line = event.data;
    if (line === 'readyok') {
      es.ready = true;
      while (es.queue.length > 0) es.worker.postMessage(es.queue.shift());
    }
    for (const l of es.listeners) l(line);
  });

  es.worker.postMessage('uci');
  es.worker.postMessage('isready');

  // Keep legacy state references in sync (some pages might still read them)
  if (key === 'gameEngine') state.gameEngine = es.worker;
  if (key === 'analysisEngine') state.analysisEngine = es.worker;

  return es;
}

export function initEngine(onMessage, engineType = 'game') {
  const es = ensureEngine(engineType);
  if (onMessage) es.listeners.push(onMessage);
}

export function clearEngineListeners(engineType = 'game') {
  const key = getEngineKey(engineType);
  engineState[key].listeners = [];
}

export function postEngineMessage(message, engineType = 'game') {
  const es = ensureEngine(engineType);
  if (!es.ready && message !== 'uci' && message !== 'isready') {
    es.queue.push(message);
    return;
  }
  es.worker.postMessage(message);
}

export function stopEngine(engineType = 'game') {
  const key = getEngineKey(engineType);
  const es = engineState[key];
  if (es.worker) es.worker.postMessage('stop');
}

// Back-compat alias (some older code may call terminate)
export const terminate = (engineType = 'game') => terminateEngine(engineType);


export function terminateEngine(engineType = 'game') {
  const key = getEngineKey(engineType);
  const es = engineState[key];
  try {
    if (es.worker) es.worker.terminate();
  } catch {
    // ignore
  }
  es.worker = null;
  es.ready = false;
  es.queue = [];
  es.listeners = [];
  es.inFlightId = 0;
  es.lastBestmove = null;

  if (key === 'gameEngine') state.gameEngine = null;
  if (key === 'analysisEngine') state.analysisEngine = null;
}



