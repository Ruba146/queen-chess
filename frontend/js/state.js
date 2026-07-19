export const state = {
  analysisBoard: null,
  analysisGame: null,
  analysisMoves: [],
  currentMoveIndex: -1,
  cachedProfile: null,
  engine: null,
  board: null,
  game: new window.Chess(),
  playerColor: 'white',
  aiLevel: 'intermediate',
  aiSettings: {
    beginner: { skill: 0, depth: 1 },
    intermediate: { skill: 5, depth: 3 },
    advanced: { skill: 10, depth: 6 },
    master: { skill: 20, depth: 14 }
  },
  currentAccuracy: 0,
  currentOpening: 'Unknown Opening',
  moveReviews: [],
  gameMoves: [],
  pendingAIMove: false,
  pendingLiveAnalysis: false,
  pendingReviewAnalysis: false,
  moveAnalysis: [],

  engineBusy: false,
  engineReady: false,
  engineMessageQueue: [],

  // Stockfish single-flight (go -> bestmove) control
  waitingBestmove: false,
  activeSearchId: 0,
  stockfishSearchId: 0,

  gameStartTime: null,
  currentGameId: null,
  gameTimerInterval: null,
  hintsEnabled: false,
  selectedColor: null,

  // Chess AI inference (deployed model) tracking
  lastPredictionPlyCount: 0,
  livePrediction: {
    whiteWin: null,
    blackWin: null,
    draw: null
  }
};

