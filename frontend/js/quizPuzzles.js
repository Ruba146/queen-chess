/**
 * Quiz Puzzles — Expanded puzzle set for the dedicated Quiz page.
 *
 * 12 categories:
 *   - Daily Challenge, Opening Quiz, Middlegame Quiz, Endgame Quiz
 *   - Tactical Quiz, Best Move, Defensive Move
 *   - Mate in 1, Mate in 2, Mate in 3
 *   - Master Games, Survival Mode
 *
 * Each puzzle has:
 *   - id, fen, solution[], category, difficulty, rating
 *   - goal: description for the user
 *   - explanation: short tactical/strategic idea
 *   - themes[]: tags for categorization
 */

const QUIZ_PUZZLES = [
  // ════════════════════════════════════════
  // DAILY CHALLENGE — one featured puzzle
  // ════════════════════════════════════════
  {
    id: 'daily-1',
    category: 'daily-challenge',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Ng5'],
    rating: 1200,
    difficulty: 'intermediate',
    themes: ['daily-challenge', 'attack', 'tactics'],
    goal: 'Find the best attacking move that exploits the weak f7 square.',
    explanation: 'Ng5 threatens checkmate on f7 with the bishop. Black must respond, giving White a strong attack.'
  },

  // ════════════════════════════════════════
  // OPENING QUIZ
  // ════════════════════════════════════════
  {
    id: 'open-1',
    category: 'opening-quiz',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['O-O'],
    rating: 800,
    difficulty: 'beginner',
    themes: ['opening', 'development', 'king-safety'],
    goal: 'A standard Italian Game position. What is the best developing move?',
    explanation: 'Castling is a top priority in the opening. It secures the king and brings the rook into play.'
  },
  {
    id: 'open-2',
    category: 'opening-quiz',
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['d4'],
    rating: 1000,
    difficulty: 'intermediate',
    themes: ['opening', 'center-control'],
    goal: 'White has developed the bishop. What is the best way to fight for the center?',
    explanation: 'd4 challenges Black\'s central pawn and opens lines for White\'s pieces. This is a standard central break.'
  },
  {
    id: 'open-3',
    category: 'opening-quiz',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    solution: ['Bc4'],
    rating: 600,
    difficulty: 'beginner',
    themes: ['opening', 'development'],
    goal: 'White has played 1.e4 e5 2.Nf3 Nc6. What is a good third move?',
    explanation: 'Bc4 develops the bishop to an active diagonal, targeting the weak f7 square.'
  },
  {
    id: 'open-4',
    category: 'opening-quiz',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3',
    solution: ['Nf3'],
    rating: 700,
    difficulty: 'beginner',
    themes: ['opening', 'development'],
    goal: 'White has played 1.e4 e5 2.Bc4. What is the best move?',
    explanation: 'Nf3 develops the knight and attacks the e5 pawn, continuing development.'
  },
  {
    id: 'open-5',
    category: 'opening-quiz',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4P3/2Bn4/8/PPP2PPP/RNBQK2R b KQkq - 0 5',
    solution: ['Nxd4'],
    rating: 900,
    difficulty: 'intermediate',
    themes: ['opening', 'capture'],
    goal: 'Black\'s knight is attacked and the pawn on e5 is hanging. What is the best move?',
    explanation: 'Nxd4 captures the bishop first before White can consolidate the center.'
  },

  // ════════════════════════════════════════
  // MIDDLEGAME QUIZ
  // ════════════════════════════════════════
  {
    id: 'mid-1',
    category: 'middlegame-quiz',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 6',
    solution: ['Ng5'],
    rating: 1100,
    difficulty: 'intermediate',
    themes: ['middlegame', 'attack', 'piece-activity'],
    goal: 'Find the best attacking move in this standard Italian middlegame.',
    explanation: 'Ng5 threatens Nxf7 and creates attacking chances against Black\'s kingside.'
  },
  {
    id: 'mid-2',
    category: 'middlegame-quiz',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 b - - 4 5',
    solution: ['Ng4'],
    rating: 1000,
    difficulty: 'intermediate',
    themes: ['middlegame', 'attack', 'initiative'],
    goal: 'Black to move. Find the move that creates the most threats.',
    explanation: 'Ng4 threatens Nxf2 and creates tactical complications.'
  },
  {
    id: 'mid-3',
    category: 'middlegame-quiz',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/4P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 4 5',
    solution: ['Bxc4'],
    rating: 950,
    difficulty: 'intermediate',
    themes: ['middlegame', 'exchange'],
    goal: 'White\'s bishop on c4 is undefended. Black\'s knight on f6 attacks it. Find the best continuation.',
    explanation: 'Bxc4 removes the bishop and equalizes the position.'
  },
  {
    id: 'mid-4',
    category: 'middlegame-quiz',
    fen: 'r2qk2r/ppp2ppp/2np1n2/2b1p3/2BPP1b1/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 6',
    solution: ['h3'],
    rating: 1200,
    difficulty: 'advanced',
    themes: ['middlegame', 'prophylaxis'],
    goal: 'White needs to address Black\'s pin. Find a good developing move that also kicks the bishop.',
    explanation: 'h3 asks the bishop what it wants — it can retreat or be captured when and where it suits White.'
  },
  {
    id: 'mid-5',
    category: 'middlegame-quiz',
    fen: 'r1bq1rk1/ppp2ppp/2np4/2b1p1B1/2B1P3/3P1N2/PPP2PPP/R2Q1RK1 w - - 0 9',
    solution: ['Bxf6'],
    rating: 1300,
    difficulty: 'advanced',
    themes: ['middlegame', 'bishop-pair', 'strategy'],
    goal: 'White has a strong bishop pair. Find the best way to exploit it.',
    explanation: 'Bxf6 eliminates the knight and gives White the bishop pair advantage in an open position.'
  },

  // ════════════════════════════════════════
  // ENDGAME QUIZ
  // ════════════════════════════════════════
  {
    id: 'end-1',
    category: 'endgame-quiz',
    fen: '8/8/8/8/8/8/5K2/3Q2k1 w - - 0 1',
    solution: ['Qd2'],
    rating: 600,
    difficulty: 'beginner',
    themes: ['endgame', 'king-and-queen'],
    goal: 'Drive the black king to the edge using queen and king coordination.',
    explanation: 'Qd2 restricts the king\'s movement. The queen and king work together to force checkmate.'
  },
  {
    id: 'end-2',
    category: 'endgame-quiz',
    fen: '8/4k3/8/3P4/8/8/4K3/8 w - - 0 1',
    solution: ['Kd3'],
    rating: 700,
    difficulty: 'beginner',
    themes: ['endgame', 'king-and-pawn'],
    goal: 'Support the pawn with your king to promote it.',
    explanation: 'The king must lead the pawn to promotion. Kd3 supports the pawn\'s advance.'
  },
  {
    id: 'end-3',
    category: 'endgame-quiz',
    fen: '8/8/8/8/8/8/5K2/4R1k1 w - - 0 1',
    solution: ['Re2'],
    rating: 800,
    difficulty: 'beginner',
    themes: ['endgame', 'rook-endgame'],
    goal: 'Use the box method to deliver checkmate with rook and king.',
    explanation: 'Re2 restricts the king\'s movement, shrinking the box step by step.'
  },
  {
    id: 'end-4',
    category: 'endgame-quiz',
    fen: '8/8/8/3k4/8/8/2K5/7B w - - 0 1',
    solution: ['Bh7'],
    rating: 1100,
    difficulty: 'intermediate',
    themes: ['endgame', 'bishop-and-king'],
    goal: 'Use your bishop to help deliver checkmate with king and bishop.',
    explanation: 'Bh7 controls key squares and helps restrict the enemy king.'
  },
  {
    id: 'end-5',
    category: 'endgame-quiz',
    fen: '8/8/4k3/8/8/3K4/8/4B3 w - - 0 1',
    solution: ['Bc3'],
    rating: 1000,
    difficulty: 'intermediate',
    themes: ['endgame', 'opposition', 'zugzwang'],
    goal: 'Use zugzwang to force the black king into a worse position.',
    explanation: 'Bc3 puts Black in zugzwang — any move worsens the position.'
  },

  // ════════════════════════════════════════
  // TACTICAL QUIZ
  // ════════════════════════════════════════
  {
    id: 'tact-1',
    category: 'tactical-quiz',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Ng5'],
    rating: 850,
    difficulty: 'beginner',
    themes: ['tactics', 'fork', 'attack'],
    goal: 'Find the tactical move that creates a double threat.',
    explanation: 'Ng5 creates a fork threat against f7 and attacks the queen — a classic knight fork pattern.'
  },
  {
    id: 'tact-2',
    category: 'tactical-quiz',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/4P3/2NP4/PPP2PPP/R1BQKBNR w KQkq - 1 4',
    solution: ['Nd5'],
    rating: 950,
    difficulty: 'intermediate',
    themes: ['tactics', 'knight-fork'],
    goal: 'Use the knight to fork the queen and rook.',
    explanation: 'Nd5 attacks multiple pieces and creates a winning fork if Black is not careful.'
  },
  {
    id: 'tact-3',
    category: 'tactical-quiz',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 6 6',
    solution: ['Bg4'],
    rating: 1050,
    difficulty: 'intermediate',
    themes: ['tactics', 'pin'],
    goal: 'Find the move that pins the white knight to the queen.',
    explanation: 'Bg4 pins the knight, stopping it from moving and potentially winning material.'
  },
  {
    id: 'tact-4',
    category: 'tactical-quiz',
    fen: '4k3/5ppp/8/8/8/8/5PPP/4RK2 w - - 0 1',
    solution: ['Re1'],
    rating: 900,
    difficulty: 'beginner',
    themes: ['tactics', 'skewer'],
    goal: 'Use the rook to skewer the king and win material.',
    explanation: 'Re1 skewers the king to the rook behind it.'
  },
  {
    id: 'tact-5',
    category: 'tactical-quiz',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 2 3',
    solution: ['Qf6'],
    rating: 800,
    difficulty: 'beginner',
    themes: ['tactics', 'double-attack'],
    goal: 'Attack both the bishop and the knight simultaneously.',
    explanation: 'Qf6 creates a double attack on f2 and the bishop, threatening checkmate.'
  },

  // ════════════════════════════════════════
  // BEST MOVE
  // ════════════════════════════════════════
  {
    id: 'best-1',
    category: 'best-move',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    solution: ['e5'],
    rating: 400,
    difficulty: 'beginner',
    themes: ['best-move', 'opening-principles'],
    goal: 'Respond to 1.e4 with the most principled move.',
    explanation: 'e5 is the best response — it fights for the center and opens lines.'
  },
  {
    id: 'best-2',
    category: 'best-move',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3',
    solution: ['Bc5'],
    rating: 700,
    difficulty: 'beginner',
    themes: ['best-move', 'development'],
    goal: 'Black has developed knights. What is the best developing move?',
    explanation: 'Bc5 develops the bishop to an active diagonal and prepares to castle.'
  },
  {
    id: 'best-3',
    category: 'best-move',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5',
    solution: ['Bg5'],
    rating: 1050,
    difficulty: 'intermediate',
    themes: ['best-move', 'pin', 'development'],
    goal: 'Find the move that pins the knight while developing.',
    explanation: 'Bg5 pins the knight to the queen, stopping ...Ng4 and continuing development.'
  },
  {
    id: 'best-4',
    category: 'best-move',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 w - - 4 5',
    solution: ['Bxc5'],
    rating: 900,
    difficulty: 'intermediate',
    themes: ['best-move', 'exchange'],
    goal: 'White has the chance to capture on c5. Should they?',
    explanation: 'Bxc5 removes the active bishop, simplifying to a better position.'
  },

  // ════════════════════════════════════════
  // DEFENSIVE MOVE
  // ════════════════════════════════════════
  {
    id: 'def-1',
    category: 'defensive-move',
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
    solution: ['Kd8'],
    rating: 900,
    difficulty: 'beginner',
    themes: ['defense', 'king-safety'],
    goal: 'The white queen has delivered check on f7. Find the only move to escape.',
    explanation: 'Kd8 is the only legal move to escape the check.'
  },
  {
    id: 'def-2',
    category: 'defensive-move',
    fen: 'rnb1kbnr/pppp1ppp/8/4p3/2B1Pq2/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    solution: ['O-O'],
    rating: 1100,
    difficulty: 'intermediate',
    themes: ['defense', 'king-safety', 'development'],
    goal: 'The black queen is attacking f2. Find the best defensive move.',
    explanation: 'Castling is the best defense — it brings the rook to protect f2 and secures the king.'
  },
  {
    id: 'def-3',
    category: 'defensive-move',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 b kq - 4 5',
    solution: ['O-O'],
    rating: 800,
    difficulty: 'beginner',
    themes: ['defense', 'king-safety'],
    goal: 'Castle to safety before White can open the center.',
    explanation: 'Castling gets the king to safety and connects the rooks.'
  },
  {
    id: 'def-4',
    category: 'defensive-move',
    fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BPP1b1/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 6',
    solution: ['h3'],
    rating: 1200,
    difficulty: 'advanced',
    themes: ['defense', 'prophylaxis', 'pin-breaking'],
    goal: 'Black\'s bishop pins the knight. Find the best way to break the pin.',
    explanation: 'h3 forces Black to decide what to do with the bishop, breaking the pin.'
  },

  // ════════════════════════════════════════
  // MATE IN 1
  // ════════════════════════════════════════
  {
    id: 'mate1-1',
    category: 'mate-in-1',
    fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    solution: ['Re8#'],
    rating: 400,
    difficulty: 'beginner',
    themes: ['mate-in-1', 'back-rank-mate'],
    goal: 'Deliver checkmate in one move.',
    explanation: 'Re8# delivers checkmate on the back rank.'
  },
  {
    id: 'mate1-2',
    category: 'mate-in-1',
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    solution: ['Qxf7#'],
    rating: 500,
    difficulty: 'beginner',
    themes: ['mate-in-1', 'sacrifice'],
    goal: 'Deliver checkmate in one move.',
    explanation: 'Qxf7# destroys the pawn shield and delivers checkmate.'
  },
  {
    id: 'mate1-3',
    category: 'mate-in-1',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Ng5'],
    rating: 600,
    difficulty: 'beginner',
    themes: ['mate-in-1', 'attack', 'weak-square'],
    goal: 'Find the move that threatens immediate checkmate.',
    explanation: 'Ng5 threatens Nxf7# — a classic Scholar\'s Mate threat.'
  },
  {
    id: 'mate1-4',
    category: 'mate-in-1',
    fen: '4k3/8/8/8/8/8/8/4Q1K1 w - - 0 1',
    solution: ['Qe8#'],
    rating: 300,
    difficulty: 'beginner',
    themes: ['mate-in-1', 'king-and-queen'],
    goal: 'Deliver checkmate with queen and king.',
    explanation: 'Qe8# delivers checkmate with the queen supported by the king.'
  },
  {
    id: 'mate1-5',
    category: 'mate-in-1',
    fen: '4k3/8/8/8/8/8/8/5RK1 w - - 0 1',
    solution: ['Rf8#'],
    rating: 350,
    difficulty: 'beginner',
    themes: ['mate-in-1', 'back-rank-mate'],
    goal: 'Deliver checkmate using the rook.',
    explanation: 'Rf8# delivers back-rank checkmate.'
  },

  // ════════════════════════════════════════
  // MATE IN 2
  // ════════════════════════════════════════
  {
    id: 'mate2-1',
    category: 'mate-in-2',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQR1K1 w kq - 4 5',
    solution: ['Rxe4', 'd5'],
    rating: 1000,
    difficulty: 'intermediate',
    themes: ['mate-in-2', 'sacrifice', 'clearance'],
    goal: 'Find the forcing sequence that leads to checkmate in two moves.',
    explanation: 'Rxe4 sacrifices the rook to clear the e-file. Black\'s best is d5, but Ng5# follows.'
  },
  {
    id: 'mate2-2',
    category: 'mate-in-2',
    fen: '4r1k1/5ppp/8/8/8/8/5PPP/5RK1 w - - 0 1',
    solution: ['Rxf7', 'Rxf7'],
    rating: 900,
    difficulty: 'intermediate',
    themes: ['mate-in-2', 'sacrifice', 'back-rank-mate'],
    goal: 'Sacrifice to deliver mate on the back rank.',
    explanation: 'Rxf7 sacrifices the rook to open the back rank. After Rxf7, Rf8# follows.'
  },
  {
    id: 'mate2-3',
    category: 'mate-in-2',
    fen: '6k1/5qpp/8/8/8/8/8/5R1K w - - 0 1',
    solution: ['Rxf7', 'Kxf7'],
    rating: 850,
    difficulty: 'intermediate',
    themes: ['mate-in-2', 'sacrifice'],
    goal: 'Remove the defender and deliver mate.',
    explanation: 'Rxf7 removes the queen, and after Kxf7, no defense remains.'
  },

  // ════════════════════════════════════════
  // MATE IN 3
  // ════════════════════════════════════════
  {
    id: 'mate3-1',
    category: 'mate-in-3',
    fen: 'r1b2rk1/pppp1ppp/2n2q2/2b5/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 5 6',
    solution: ['Bg5', 'Qxg5', 'Nxg5'],
    rating: 1200,
    difficulty: 'advanced',
    themes: ['mate-in-3', 'pin', 'sacrifice'],
    goal: 'Find the three-move combination leading to checkmate.',
    explanation: 'Bg5 pins the queen to the king. If Qxg5, Nxg5 wins the queen.'
  },
  {
    id: 'mate3-2',
    category: 'mate-in-3',
    fen: 'r1b1k2r/pppp1ppp/2n2q2/2b5/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 w kq - 6 5',
    solution: ['Bxf7+', 'Rxf7', 'Qd5+'],
    rating: 1300,
    difficulty: 'advanced',
    themes: ['mate-in-3', 'sacrifice', 'attack'],
    goal: 'Sacrifice the bishop and deliver checkmate in three moves.',
    explanation: 'Bxf7+ forces the rook to capture, then Qd5+ wins the queen.'
  },
  {
    id: 'mate3-3',
    category: 'mate-in-3',
    fen: '2kr1b1r/pppqpppp/2n5/8/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 5',
    solution: ['Nd5', 'Nxd5', 'Qxd5'],
    rating: 1100,
    difficulty: 'advanced',
    themes: ['mate-in-3', 'fork', 'discovered-attack'],
    goal: 'Use the knight to fork and create threats.',
    explanation: 'Nd5 attacks the queen and threatens check. Black must respond, losing material.'
  },

  // ════════════════════════════════════════
  // MASTER GAMES QUIZ
  // ════════════════════════════════════════
  {
    id: 'master-1',
    category: 'master-games',
    fen: 'r1b1k2r/pppp1ppp/2n2q2/2b5/2B1P3/2NP4/PPP2PPP/R1BQ1RK1 w kq - 6 5',
    solution: ['Bxf7+'],
    rating: 1400,
    difficulty: 'advanced',
    themes: ['master-games', 'sacrifice', 'attack'],
    goal: 'A classic master game sacrifice. Find the winning continuation.',
    explanation: 'Bxf7+ is a classic sacrifice to expose the king and launch a decisive attack.'
  },
  {
    id: 'master-2',
    category: 'master-games',
    fen: 'r1bq1rk1/ppp2ppp/2np4/2b1p1B1/2B1P3/3P1N2/PPP2PPP/R2Q1RK1 w - - 0 9',
    solution: ['Bxf6'],
    rating: 1500,
    difficulty: 'advanced',
    themes: ['master-games', 'bishop-pair', 'strategy'],
    goal: 'Exchange to gain the bishop pair in an open position.',
    explanation: 'Bxf6 is a common master-level strategy to gain the bishop pair in open positions.'
  },

  // ════════════════════════════════════════
  // SURVIVAL MODE — easier puzzles for endurance
  // ════════════════════════════════════════
  {
    id: 'surv-1',
    category: 'survival-mode',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    solution: ['e5'],
    rating: 400,
    difficulty: 'beginner',
    themes: ['survival', 'opening'],
    goal: 'Find the best response to 1.e4.',
    explanation: 'e5 is the standard response, fighting for the center.'
  },
  {
    id: 'surv-2',
    category: 'survival-mode',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3',
    solution: ['Bc5'],
    rating: 600,
    difficulty: 'beginner',
    themes: ['survival', 'development'],
    goal: 'Continue developing in the Italian Game.',
    explanation: 'Bc5 develops the bishop to an active diagonal.'
  },
  {
    id: 'surv-3',
    category: 'survival-mode',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5',
    solution: ['Bg5'],
    rating: 800,
    difficulty: 'intermediate',
    themes: ['survival', 'pin', 'development'],
    goal: 'Find the best developing move in this position.',
    explanation: 'Bg5 pins the knight and continues development.'
  },
  {
    id: 'surv-4',
    category: 'survival-mode',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 6',
    solution: ['Ng5'],
    rating: 900,
    difficulty: 'intermediate',
    themes: ['survival', 'attack'],
    goal: 'Find the best middlegame continuation.',
    explanation: 'Ng5 creates attacking threats against the kingside.'
  },
  {
    id: 'surv-5',
    category: 'survival-mode',
    fen: '8/8/8/8/8/8/5K2/3Q2k1 w - - 0 1',
    solution: ['Qd2'],
    rating: 500,
    difficulty: 'beginner',
    themes: ['survival', 'endgame'],
    goal: 'Find the best move in this queen endgame.',
    explanation: 'Qd2 restricts the king and brings the queen closer.'
  },
  {
    id: 'surv-6',
    category: 'survival-mode',
    fen: '8/8/8/3k4/8/8/2K5/7B w - - 0 1',
    solution: ['Bh7'],
    rating: 700,
    difficulty: 'beginner',
    themes: ['survival', 'endgame'],
    goal: 'Use the bishop to help restrict the black king.',
    explanation: 'Bh7 controls key squares around the enemy king.'
  },
  {
    id: 'surv-7',
    category: 'survival-mode',
    fen: '8/4k3/8/3P4/8/8/4K3/8 w - - 0 1',
    solution: ['Kd3'],
    rating: 600,
    difficulty: 'beginner',
    themes: ['survival', 'endgame', 'pawn-promotion'],
    goal: 'Support the pawn for promotion.',
    explanation: 'The king must lead the pawn forward.'
  },
  {
    id: 'surv-8',
    category: 'survival-mode',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Ng5'],
    rating: 800,
    difficulty: 'beginner',
    themes: ['survival', 'tactics'],
    goal: 'Find the tactical opportunity.',
    explanation: 'Ng5 creates a threat of Nxf7#.'
  }
];

/**
 * Get all puzzles for a given category.
 * @param {string} category
 * @returns {Array}
 */
export function getPuzzlesByCategory(category) {
  if (!category || category === 'all') return QUIZ_PUZZLES;
  return QUIZ_PUZZLES.filter(p => p.category === category);
}

/**
 * Get a specific puzzle by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getPuzzleById(id) {
  return QUIZ_PUZZLES.find(p => p.id === id) || null;
}

/**
 * Get all puzzle categories with their metadata.
 * @returns {Array}
 */
export function getQuizCategories() {
  return [
    { id: 'daily-challenge', icon: '🌟', title: 'Daily Challenge', desc: 'One featured puzzle refreshed daily.', count: getPuzzlesByCategory('daily-challenge').length },
    { id: 'opening-quiz', icon: '♟', title: 'Opening Quiz', desc: 'Test your opening knowledge and find the best developing moves.', count: getPuzzlesByCategory('opening-quiz').length },
    { id: 'middlegame-quiz', icon: '♞', title: 'Middlegame Quiz', desc: 'Navigate complex middlegame positions with the best plans.', count: getPuzzlesByCategory('middlegame-quiz').length },
    { id: 'endgame-quiz', icon: '🏁', title: 'Endgame Quiz', desc: 'Master endgame technique and conversion.', count: getPuzzlesByCategory('endgame-quiz').length },
    { id: 'tactical-quiz', icon: '⚡', title: 'Tactical Quiz', desc: 'Spot tactical patterns: forks, pins, skewers and more.', count: getPuzzlesByCategory('tactical-quiz').length },
    { id: 'best-move', icon: '🎯', title: 'Best Move', desc: 'Find the single best move in any position.', count: getPuzzlesByCategory('best-move').length },
    { id: 'defensive-move', icon: '🛡️', title: 'Defensive Move', desc: 'Find the only saving move in critical positions.', count: getPuzzlesByCategory('defensive-move').length },
    { id: 'mate-in-1', icon: '👑', title: 'Mate in 1', desc: 'Deliver checkmate in a single move.', count: getPuzzlesByCategory('mate-in-1').length },
    { id: 'mate-in-2', icon: '💎', title: 'Mate in 2', desc: 'Find the two-move checkmate sequence.', count: getPuzzlesByCategory('mate-in-2').length },
    { id: 'mate-in-3', icon: '🔥', title: 'Mate in 3', desc: 'Calculate the three-move checkmate combination.', count: getPuzzlesByCategory('mate-in-3').length },
    { id: 'master-games', icon: '🏆', title: 'Master Games', desc: 'Find the winning moves from real master games.', count: getPuzzlesByCategory('master-games').length },
    { id: 'survival-mode', icon: '💪', title: 'Survival Mode', desc: 'Solve puzzle after puzzle without making a mistake!', count: getPuzzlesByCategory('survival-mode').length }
  ];
}

export default QUIZ_PUZZLES;

