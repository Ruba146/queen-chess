/**
 * Stockfish engine wrapper for the React client.
 *
 * Reuses the existing project Stockfish worker (`/stockfish.js`) and its
 * bundled wasm (`/stockfish.wasm`). Exposes a small promise-based UCI API
 * for requesting best moves and position evaluations from a given FEN.
 */

let worker = null
let ready = false

const queue = []
let processing = false

function ensureWorker() {
  if (worker) return true
  try {
    worker = new Worker('/stockfish.js')
  } catch (err) {
    console.error('Failed to start Stockfish worker', err)
    return false
  }

  worker.addEventListener('message', (event) => {
    const line = event.data
    if (typeof line !== 'string') return

    if (line === 'readyok') {
      ready = true
      return
    }

    if (!queue.length) return
    const current = queue[0]

    if (line.startsWith('bestmove')) {
      const parts = line.split(' ')
      const move = parts[1]
      const result = { type: 'bestmove', move: move === '(none)' ? null : move }
      current.resolve(result)
      queue.shift()
      processQueue()
      return
    }

    const infoMatch = line.match(/^info\s+.*?\bdepth\s+(\d+).*?\bscore\s+(cp|mate)\s+(-?\d+)(?:\s+.*?\bpv\s+([\w\s]+))?/)
    if (infoMatch) {
      const [, depthStr, scoreType, scoreStr, pvStr] = infoMatch
      const info = {
        type: 'info',
        depth: parseInt(depthStr, 10),
        score: scoreType === 'mate'
          ? { mate: parseInt(scoreStr, 10), cp: null }
          : { cp: parseInt(scoreStr, 10), mate: null },
        pv: pvStr ? pvStr.trim().split(/\s+/) : [],
      }
      if (current.onInfo) {
        current.onInfo(info)
      }
    }
  })

  worker.addEventListener('error', (err) => {
    console.error('Stockfish worker error', err)
  })

  worker.postMessage('uci')
  worker.postMessage('isready')
  return true
}

function waitForReady() {
  return new Promise((resolve) => {
    if (ready) {
      resolve(true)
      return
    }
    const check = () => {
      if (ready) resolve(true)
      else setTimeout(check, 50)
    }
    check()
  })
}

function processQueue() {
  if (processing || !queue.length) return
  processing = true

  const current = queue[0]
  worker.postMessage('stop')
  worker.postMessage('setoption name Skill Level value ' + (current.skill ?? 5))
  worker.postMessage('position fen ' + current.fen)
  worker.postMessage('go ' + (current.depth ? 'depth ' + current.depth : 'movetime ' + current.movetime))
}

export async function getBestMove(fen, options = {}) {
  const { skill = 5, depth = 12, movetime = 500 } = options
  if (!ensureWorker()) return null
  await waitForReady()

  return new Promise((resolve) => {
    queue.push({
      fen,
      skill,
      depth,
      movetime,
      resolve,
      onInfo: null,
    })
    processQueue()

    setTimeout(() => {
      const idx = queue.findIndex((q) => q.resolve === resolve)
      if (idx !== -1) {
        queue.splice(idx, 1)
        resolve(null)
        if (idx === 0) processQueue()
      }
    }, Math.max(movetime + 1000, 5000))
  })
}

export async function getEvaluation(fen, options = {}) {
  const { skill = 5, depth = 14, movetime = 400 } = options
  if (!ensureWorker()) return null
  await waitForReady()

  return new Promise((resolve) => {
    let bestInfo = null

    queue.push({
      fen,
      skill,
      depth,
      movetime,
      resolve: () => resolve(bestInfo),
      onInfo: (info) => {
        if (info.depth >= depth) {
          bestInfo = info
        }
      },
    })
    processQueue()

    setTimeout(() => {
      const idx = queue.findIndex((q) => q.resolve === resolve)
      if (idx !== -1) {
        queue.splice(idx, 1)
        resolve(bestInfo)
        if (idx === 0) processQueue()
      }
    }, Math.max(movetime + 1000, 5000))
  })
}

export function terminateEngine() {
  if (worker) {
    try {
      worker.terminate()
    } catch {
      // ignore
    }
  }
  worker = null
  ready = false
  queue.length = 0
  processing = false
}
