/**
 * Puzzle Service - Provider abstraction for chess tactical puzzles.
 *
 * Expanded for Phase 3 with puzzles for all categories:
 *   - Mate in 1, Mate in 2, Mate in 3
 *   - Winning material, Fork, Pin, Skewer
 *   - Double attack, Discovered attack, Deflection
 *   - Removing the defender, Endgame, Middlegame
 *
 * Designed to be replaced with Lichess Puzzle Database or
 * any external puzzle API by swapping the provider implementation.
 *
 * Provider interface:
 *   getPuzzleSet()          -> Array of puzzle objects
 *   getPuzzleById(id)       -> Single puzzle object
 *   fetchPuzzleSet(filters) -> Promise<Array> (async, for external sources)
 *   getPuzzlesByCategory(category) -> Array filtered by theme
 */

const FALLBACK_PUZZLES = [
  // ── MATE IN 1 ──
  {
    id: 'mate1-1',
    source: 'Classic mate patterns',
    fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    solution: ['Re8#'],
    rating: 600,
    themes: ['mate-in-1', 'back-rank-mate'],
    goal: 'Deliver checkmate in one move.'
  },
  {
    id: 'mate1-2',
    source: 'Classic mate patterns',
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    solution: ['Qxf7#'],
    rating: 800,
    themes: ['mate-in-1', 'sacrifice'],
    goal: 'Deliver checkmate in one move.'
  },
  {
    id: 'mate1-3',
    source: 'Classic mate patterns',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Ng5'],
    rating: 750,
    themes: ['mate-in-1', 'attack', 'weak-square'],
    goal: 'Find the move that threatens immediate checkmate.'
  },

  // ── MATE IN 2 ──
  {
    id: 'mate2-1',
    source: 'Classic mate patterns',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQR1K1 w kq - 4 5',
    solution: ['Rxe4', 'd5'],
    rating: 1000,
    themes: ['mate-in-2', 'sacrifice', 'clearance'],
    goal: 'Find the forcing sequence that leads to checkmate in two moves.'
  },
  {
    id: 'mate2-2',
    source: 'Classic mate patterns',
    fen: '4r1k1/5ppp/8/8/8/8/5PPP/5RK1 w - - 0 1',
    solution: ['Rxf7', 'Rxf7'],
    rating: 900,
    themes: ['mate-in-2', 'sacrifice', 'back-rank-mate'],
    goal: 'Sacrifice to deliver mate on the back rank.'
  },

  // ── MATE IN 3 ──
  {
    id: 'mate3-1',
    source: 'Classic mate patterns',
    fen: 'r1b2rk1/pppp1ppp/2n2q2/2b5/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 5 6',
    solution: ['Bg5', 'Qxg5', 'Nxg5'],
    rating: 1200,
    themes: ['mate-in-3', 'pin', 'sacrifice'],
    goal: 'Find the three-move combination leading to checkmate.'
  },

  // ── FORK ──
  {
    id: 'fork-1',
    source: 'Basic fork patterns',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Ng5'],
    rating: 700,
    themes: ['fork', 'attack'],
    goal: 'Fork the queen and rook on the same move.'
  },
  {
    id: 'fork-2',
    source: 'Knight fork',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/4P3/2NP4/PPP2PPP/R1BQKBNR w KQkq - 1 4',
    solution: ['Nd5'],
    rating: 850,
    themes: ['fork', 'knight'],
    goal: 'Use the knight to fork the queen and rook.'
  },

  // ── PIN ──
  {
    id: 'pin-1',
    source: 'Pin patterns',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5',
    solution: ['Bg5'],
    rating: 1100,
    themes: ['pin', 'development'],
    goal: 'Pin the knight to the queen while continuing development.'
  },
  {
    id: 'pin-2',
    source: 'Absolute pin',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b kq - 5 5',
    solution: ['Bg4'],
    rating: 1000,
    themes: ['pin', 'development'],
    goal: 'Pin the knight to the queen.'
  },

  // ── SKEWER ──
  {
    id: 'skewer-1',
    source: 'Skewer patterns',
    fen: 'r3k2r/pppq1ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 6',
    solution: ['Bh5'],
    rating: 1050,
    themes: ['skewer', 'attack'],
    goal: 'Skewer the queen to the rook along the diagonal.'
  },
  {
    id: 'skewer-2',
    source: 'Skewer patterns',
    fen: '4k3/5ppp/8/8/8/8/5PPP/4RK2 w - - 0 1',
    solution: ['Re1'],
    rating: 900,
    themes: ['skewer', 'endgame'],
    goal: 'Skewer the king to win the rook.'
  },

  // ── DOUBLE ATTACK ──
  {
    id: 'double-1',
    source: 'Double attack patterns',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3',
    solution: ['Qf6'],
    rating: 800,
    themes: ['double-attack', 'middlegame'],
    goal: 'Attack both the bishop and the knight simultaneously.'
  },

  // ── DISCOVERED ATTACK ──
  {
    id: 'discovered-1',
    source: 'Discovered attack patterns',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Ng5'],
    rating: 950,
    themes: ['discovered-attack', 'attack'],
    goal: 'Move the knight to discover an attack on the queen.'
  },

  // ── DEFLECTION ──
  {
    id: 'deflect-1',
    source: 'Deflection patterns',
    fen: 'r1b1kb1r/pppp1ppp/2n2q2/4p3/2B1n3/5N2/PPPP1PPP/RNBQR1K1 w kq - 4 5',
    solution: ['Rxe4'],
    rating: 1100,
    themes: ['deflection', 'sacrifice'],
    goal: 'Deflect the knight from defending the queen.'
  },
  {
    id: 'deflect-2',
    source: 'Deflection patterns',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 6',
    solution: ['Bxf7+'],
    rating: 1200,
    themes: ['deflection', 'sacrifice'],
    goal: 'Deflect the king from defending the queen.'
  },

  // ── REMOVING THE DEFENDER ──
  {
    id: 'remove-1',
    source: 'Removing defender patterns',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Bxf7+'],
    rating: 1150,
    themes: ['removing-the-defender', 'sacrifice'],
    goal: 'Remove the defender of the e4-knight.'
  },
  {
    id: 'remove-2',
    source: 'Removing defender patterns',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 6',
    solution: ['Bxf7+'],
    rating: 1250,
    themes: ['removing-the-defender', 'sacrifice'],
    goal: 'Remove the defender to win material.'
  },

  // ── WINNING MATERIAL ──
  {
    id: 'win-1',
    source: 'Material win patterns',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/2NP4/PPP2PPP/R1BQK1NR w KQkq - 2 4',
    solution: ['Nd5'],
    rating: 850,
    themes: ['winning-material', 'fork'],
    goal: 'Win material with a double attack.'
  },
  {
    id: 'win-2',
    source: 'Material win patterns',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b kq - 5 5',
    solution: ['Nxe4'],
    rating: 900,
    themes: ['winning-material', 'fork'],
    goal: 'Win a pawn with the knight.'
  },

  // ── ENDGAME ──
  {
    id: 'endgame-1',
    source: 'Basic endgame patterns',
    fen: '8/8/8/8/8/8/5K2/3Q2k1 w - - 0 1',
    solution: ['Qd2'],
    rating: 600,
    themes: ['endgame', 'king-and-queen'],
    goal: 'Drive the king to the edge of the board using queen and king.'
  },
  {
    id: 'endgame-2',
    source: 'Pawn endgame',
    fen: '8/4k3/8/3P4/8/8/4K3/8 w - - 0 1',
    solution: ['Kd3'],
    rating: 700,
    themes: ['endgame', 'king-and-pawn'],
    goal: 'Support the pawn with your king to promote it.'
  },
  {
    id: 'endgame-3',
    source: 'Rook endgame',
    fen: '8/8/8/8/8/8/5K2/4R1k1 w - - 0 1',
    solution: ['Re2'],
    rating: 800,
    themes: ['endgame', 'rook-endgame'],
    goal: 'Use the box method to deliver checkmate with rook and king.'
  },

  // ── MIDDLEGAME ──
  {
    id: 'mid-1',
    source: 'Classic middlegame patterns',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 6',
    solution: ['Ng5'],
    rating: 1100,
    themes: ['middlegame', 'attack'],
    goal: 'Find the best attacking move in the middlegame.'
  },
  {
    id: 'mid-2',
    source: 'Middlegame tactics',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 b - - 4 5',
    solution: ['Ng4'],
    rating: 1000,
    themes: ['middlegame', 'attack'],
    goal: 'Find the move that creates the most threats in the middlegame.'
  },

  // ── Original puzzles kept for backward compatibility ──
  {
    id: 'puzzle-knight-fork',
    source: 'Demo — replace with Lichess Puzzle DB',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Ng5'],
    rating: 950,
    themes: ['attack', 'weak-square', 'middlegame'],
    goal: 'Find the forcing move that exploits the weak f7 square.'
  },
  {
    id: 'puzzle-castle',
    source: 'Demo — replace with Lichess Puzzle DB',
    fen: 'rnb1kbnr/pppp1ppp/8/4p3/2B1q3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    solution: ['O-O'],
    rating: 1050,
    themes: ['development', 'king-safety', 'middlegame'],
    goal: 'Respond to the queen intrusion with a developing move that also secures the king.'
  },
  {
    id: 'puzzle-pin',
    source: 'Demo — replace with Lichess Puzzle DB',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5',
    solution: ['Bg5'],
    rating: 1250,
    themes: ['pin', 'development', 'middlegame'],
    goal: 'Pin the knight while continuing development.'
  }
];

/** Return the full puzzle set. */
export function getPuzzleSet() {
  return FALLBACK_PUZZLES;
}

/** Find a puzzle by id. */
export function getPuzzleById(id) {
  return FALLBACK_PUZZLES.find((p) => p.id === id) || FALLBACK_PUZZLES[0];
}

/**
 * Get puzzles by category/theme.
 * @param {string} category - Theme/category name (e.g. 'mate-in-1', 'fork', 'pin')
 * @returns {Array} Filtered puzzles
 */
export function getPuzzlesByCategory(category) {
  if (!category || category === 'mixed' || category === 'all') return FALLBACK_PUZZLES;
  return FALLBACK_PUZZLES.filter(p =>
    (p.themes || []).some(t => t.toLowerCase().includes(category.toLowerCase()))
  );
}

/**
 * Async fetch — placeholder for connecting to Lichess Puzzle Database.
 *
 * When the real puzzle database is loaded, replace this function to
 * query the local IndexedDB or fetch from a backend endpoint.
 *
 * @param {Object} filters - { ratingMin, ratingMax, themes, count }
 * @returns {Promise<Array>}
 */
export async function fetchPuzzleSet(filters = {}) {
  const { ratingMin, ratingMax, themes, count } = filters;

  let results = [...FALLBACK_PUZZLES];

  // Filter by rating
  if (ratingMin) results = results.filter(p => (p.rating || 0) >= ratingMin);
  if (ratingMax) results = results.filter(p => (p.rating || 0) <= ratingMax);

  // Filter by themes
  if (themes && themes.length > 0) {
    results = results.filter(p =>
      themes.some(t => (p.themes || []).includes(t))
    );
  }

  // Limit count
  if (count && count > 0) {
    results = results.slice(0, count);
  }

  return results;
}

/**
 * Fetch a puzzle by its rating range and themes.
 */
export async function fetchPuzzleByRating(rating, themes = []) {
  const range = rating < 1000 ? [800, 1100] : rating < 1400 ? [1100, 1500] : rating < 1800 ? [1500, 1900] : [1800, 2500];
  return fetchPuzzleSet({ ratingMin: range[0], ratingMax: range[1], themes });
}

