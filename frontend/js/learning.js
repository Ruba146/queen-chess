/**
 * Queen Chess - Learning Page Module
 * Comprehensive chess education covering basics, openings, tactics, endgames, and AI coach tips.
 */

// ──────────────────────────────────────────────
// RENDER HELPERS
// ──────────────────────────────────────────────

/**
 * Renders a mini chess board grid using the project's piece images.
 * @param {string} boardId - Unique ID for the board container
 * @param {Array<Array<string|null>>} position - 8x8 grid of piece codes (e.g., 'wP', 'bK') or null
 * @param {string} [size='180px'] - CSS size for the board
 * @param {string} [flipped='false'] - Whether board is flipped (black at bottom)
 * @returns {string} HTML string
 */
function renderMiniBoard(boardId, position, size = '180px', flipped = 'false') {
  const rankLabels = flipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  let rows = '';
  rankLabels.forEach((rank, ri) => {
    const rowIndex = flipped ? 7 - ri : ri;
    let cells = '';
    for (let fi = 0; fi < 8; fi++) {
      const isLight = (ri + fi) % 2 === 0;
      const piece = position[rowIndex] ? position[rowIndex][fi] : null;
      const pieceHtml = piece
        ? `<img src="img/chesspieces/wikipedia/${piece}.png" alt="${piece}" style="width:100%;height:100%;object-fit:contain;" draggable="false">`
        : '';
      cells += `<div class="learning-board-cell ${isLight ? 'light' : 'dark'}">${pieceHtml}</div>`;
    }
    rows += `<div class="learning-board-row">${cells}</div>`;
  });

  return `
    <div class="learning-mini-board-wrapper" style="width:${size};height:${size};">
      <div class="learning-mini-board" id="${boardId}">${rows}</div>
    </div>
  `;
}

/**
 * Creates a collapsible accordion section with smooth animation.
 * @param {string} id - Unique section ID
 * @param {string} title - Section title
 * @param {string} contentHtml - Inner HTML content
 * @param {string} [icon='📚'] - Emoji/icon for the header
 * @param {boolean} [openByDefault=false] - Whether section starts expanded
 * @returns {string} HTML string
 */
function renderCollapsible(id , title, contentHtml, icon = '📚', openByDefault = false) {
  const isOpen = openByDefault ? 'open' : '';
  const bodyStyle = openByDefault ? 'max-height:20000px;' : '';
  return `
    <div class="learning-collapsible ${isOpen}" id="collapsible-${id}">
      <div class="learning-collapsible-header" onclick="toggleLearningSection('${id}')">
        <span class="learning-collapsible-icon">${icon}</span>
        <span class="learning-collapsible-title">${title}</span>
        <span class="learning-collapsible-arrow">▾</span>
      </div>
      <div class="learning-collapsible-body" id="collapseBody-${id}" style="${bodyStyle}">
        <div class="learning-collapsible-inner">${contentHtml}</div>
      </div>
    </div>
  `;
}

/**
 * Renders a topic card used across basics, tactics, endgames.
 */
function renderTopicCard(icon, title, description, extra = '') {
  return `
    <div class="learning-topic-card learning-hover-scale">
      <div class="learning-topic-icon">${icon}</div>
      <div class="learning-topic-content">
        <h4 class="learning-topic-title">${title}</h4>
        <p class="learning-topic-desc">${description}</p>
        ${extra}
      </div>
    </div>
  `;
}

/**
 * Renders a difficulty badge.
 */
function renderDifficultyBadge(level) {
  const colors = { Beginner: '#9ca3af', Intermediate: '#4ade80', Advanced: '#60a5fa', Expert: '#c084fc' };
  const color = colors[level] || '#9ca3af';
  return `<span class="learning-difficulty-badge" style="background:${color}15;color:${color};border-color:${color}30;">${level}</span>`;
}

// ──────────────────────────────────────────────
// CHESS BASICS
// ──────────────────────────────────────────────

function renderChessBasics() {
  const pieces = [
    { icon: '♔', name: 'King', move: 'Moves one square in any direction (horizontally, vertically, or diagonally). The most important piece — if your king is checkmated, you lose.' },
    { icon: '♕', name: 'Queen', move: 'Moves any number of squares in any direction (horizontally, vertically, or diagonally). The most powerful piece on the board.' },
    { icon: '♖', name: 'Rook', move: 'Moves any number of squares horizontally or vertically. Powerful on open files and ranks.' },
    { icon: '♗', name: 'Bishop', move: 'Moves any number of squares diagonally. Each bishop stays on its starting color forever.' },
    { icon: '♘', name: 'Knight', move: 'Moves in an L-shape: two squares in one direction, then one square perpendicular. Can jump over other pieces.' },
    { icon: '♙', name: 'Pawn', move: 'Moves one square forward (or two on its first move). Captures diagonally forward. Can promote upon reaching the last rank.' }
  ];

  const piecesHtml = pieces.map(p => `
    <div class="learning-piece-card learning-hover-scale">
      <div class="learning-piece-icon">${p.icon}</div>
      <div class="learning-piece-info">
        <h4>${p.name}</h4>
        <p>${p.move}</p>
      </div>
    </div>
  `).join('');

  const rules = [
    { icon: '🎯', title: 'Check', desc: 'When your king is under attack by an opponent\'s piece. You must respond immediately by moving the king, blocking the attack, or capturing the attacking piece.' },
    { icon: '💀', title: 'Checkmate', desc: 'When your king is in check and there is no legal move to escape. This ends the game — the player delivering checkmate wins.' },
    { icon: '🤝', title: 'Stalemate', desc: 'When the player to move has no legal moves but their king is NOT in check. The game ends in a draw. A common lifesaver for losing positions.' },
    { icon: '🏰', title: 'Castling', desc: 'A special move involving the king and a rook. The king moves two squares toward the rook, and the rook jumps over to the square next to the king. Can only be done if neither piece has moved, no pieces between them, and the king is not in check.' },
    { icon: '🔄', title: 'En Passant', desc: 'A special pawn capture. When an opponent\'s pawn moves two squares from its starting position and lands beside your pawn, you may capture it as if it had moved only one square. This must be done immediately on the next move.' },
    { icon: '⬆', title: 'Pawn Promotion', desc: 'When a pawn reaches the opposite side of the board (the 8th rank for white, 1st for black), it must be promoted to a queen, rook, bishop, or knight. Promoting to a queen (queening) is most common.' }
  ];

  const rulesHtml = rules.map(r => renderTopicCard(r.icon, r.title, r.desc)).join('');

  // Board coordinates visual using existing piece images
  const emptyBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  // Place a few pieces for visual interest on the coordinates board
  emptyBoard[0][0] = 'bR'; emptyBoard[0][4] = 'bK'; emptyBoard[0][7] = 'bR';
  emptyBoard[7][0] = 'wR'; emptyBoard[7][4] = 'wK'; emptyBoard[7][7] = 'wR';
  emptyBoard[0][3] = 'bQ'; emptyBoard[7][3] = 'wQ';

  return `
    <div class="learning-section-content">
      <div class="learning-intro-text">
        <p>Chess is played on an 8×8 board with 64 squares. The board is oriented so a <strong>light square</strong> is on each player's right-hand corner. Files (columns) are labeled <strong>a–h</strong>, ranks (rows) are labeled <strong>1–8</strong>. White starts on ranks 1–2, Black on ranks 7–8.</p>
      </div>

      <h4 class="learning-subsection-title">♟ Piece Movements</h4>
      <div class="learning-pieces-grid">
        ${piecesHtml}
      </div>

      <h4 class="learning-subsection-title" style="margin-top:24px;">📖 Essential Rules</h4>
      <div class="learning-rules-grid">
        ${rulesHtml}
      </div>

      <div class="learning-coordinates-demo">
        <h4>♜ Board Coordinates</h4>
        <p style="color:#aaa;font-size:13px;margin-bottom:12px;">Files (a–h) go left to right from White's perspective. Ranks (1–8) go from White's side to Black's side. Every square has a unique coordinate, e.g., <strong>e4</strong>, <strong>d5</strong>, <strong>g1</strong>.</p>
        ${renderMiniBoard('boardCoords', emptyBoard, '240px')}
        <p style="color:#888;font-size:12px;margin-top:8px;">Highlighted squares: White pieces on rank 1–2, Black pieces on rank 7–8</p>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// CHESS OPENINGS
// ──────────────────────────────────────────────

function renderOpenings() {
  const openings = [
    {
      name: 'Italian Game',
      icon: '🇮🇹',
      difficulty: 'Beginner',
      moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4',
      explanation: 'One of the oldest and most popular chess openings. White develops rapidly, aiming for quick castling and a strong center while targeting Black\'s f7-pawn — the weakest square in the starting position.',
      mainIdea: 'Control the center with e4, develop the knight to f3, and deploy the bishop to c4 where it eyes Black\'s vulnerable f7 square.',
      advantages: ['Rapid piece development', 'Strong central control', 'Leads to open, tactical games', 'Good for learning fundamental chess principles'],
      commonMoves: ['3...Bc5 (Giuoco Piano) — symmetrical development', '3...Nf6 (Two Knights Defense) — counter-attack', '3...Be7 (Hungarian Defense) — solid but passive'],
      commonMistakes: ['Playing Bc4 too early without preparation', 'Neglecting d2-d4 push to open the center', 'Weakening kingside with unnecessary pawn moves'],
      tip: 'Focus on rapid development. Castle early (by move 5–6), then look to push d4 to dominate the center.'
    },
    {
      name: 'Ruy Lopez',
      icon: '🇪🇸',
      difficulty: 'Intermediate',
      moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5',
      explanation: 'Also called the Spanish Opening, the Ruy Lopez is one of the most deeply analyzed openings in chess. White pressures the knight defending e5, indirectly challenging Black\'s control of the center.',
      mainIdea: 'Attack the knight that defends the e5 pawn. White aims to trade the bishop for the knight, doubling Black\'s pawns and gaining a structural advantage.',
      advantages: ['Excellent long-term strategic pressure', 'Leads to rich middlegame positions', 'Played at all levels from club to world championship', 'Many solid variations to choose from'],
      commonMoves: ['3...a6 (Morphy Defense) — ask what the bishop intends', '3...Nf6 (Berlin Defense) — solid and drawish', '3...Bc5 (Classical Defense) — developing and counter-attacking'],
      commonMistakes: ['Retreating the bishop to a4 too early without pressure', 'Neglecting c3 and d4 to open the center', 'Underestimating Black\'s ...Bg4 pin on the knight'],
      tip: 'Learn the "Spanish Torture" approach: small positional pressure rather than immediate attacks. Patience is key.'
    },
    {
      name: 'Sicilian Defense',
      icon: '🛡️',
      difficulty: 'Advanced',
      moves: '1.e4 c5',
      explanation: 'The most popular response to 1.e4 at all levels. Black immediately fights for control of the center by attacking the d4 square, creating an asymmetrical position that offers winning chances for both sides.',
      mainIdea: 'Black avoids symmetrical positions and creates an imbalanced game. By playing c5 instead of e5, Black controls d4 while building a solid counter-attacking structure.',
      advantages: ['Asymmetrical — high winning chances for both sides', 'Black fights for the initiative', 'Rich opening theory with many systems', 'Excellent for aggressive players'],
      commonMoves: ['2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 (Open Sicilian)', '2.Nf3 e6 (Taimanov Variation) — flexible', '2.Nf3 Nc6 (Classical Sicilian) — solid development'],
      commonMistakes: ['Falling behind in development while attacking', 'Premature queen sorties', 'Neglecting kingside safety in sharp variations'],
      tip: 'Study the specific variation you choose deeply. The Sicilian rewards preparation more than any other opening.'
    },
    {
      name: 'Queen\'s Gambit',
      icon: '👑',
      difficulty: 'Intermediate',
      moves: '1.d4 d5 2.c4',
      explanation: 'A powerful and time-tested opening where White offers a pawn to gain central control and rapid development. Popularized worldwide by the Netflix series, it remains a top choice for positional players.',
      mainIdea: 'White sacrifices the c4 pawn (temporarily) to lure Black\'s pawn away from the center, then build a strong pawn center with e4.',
      advantages: ['Strong central control', 'Safe and solid king position', 'Leads to clear strategic plans', 'Suitable for players who prefer positional chess'],
      commonMoves: ['2...dxc4 (Accepted) — Black takes the pawn', '2...e6 (Declined) — Black reinforces d5', '2...c6 (Slav Defense) — solid and flexible'],
      commonMistakes: ['Trying to hold onto the c4 pawn at all costs (Accepted)', 'Premature development without central control', 'Neglecting the light-squared bishop\'s development'],
      tip: 'Develop your pieces harmoniously. The c4 pawn is bait — focus on rapid development and central control rather than material.'
    },
    {
      name: 'French Defense',
      icon: '🇫🇷',
      difficulty: 'Intermediate',
      moves: '1.e4 e6',
      explanation: 'A solid and resilient opening for Black. The French Defense creates a strong pawn chain but can lead to a cramped position. It has been a favorite of many world champions, known for its counter-attacking potential.',
      mainIdea: 'Black solidifies the d5 square and creates a pawn chain e6-d5. Black accepts a space disadvantage early to launch a counter-attack in the center and queenside.',
      advantages: ['Solid and hard to break down', 'Clear strategic plans for both sides', 'Excellent for positional players', 'Counter-attacking opportunities'],
      commonMoves: ['2.d4 d5 3.Nc3 (Classical) — main line', '2.d4 d5 3.Nd2 (Tarrasch) — solid and positional', '2.d4 d5 3.e5 (Advance) — space-gaining'],
      commonMistakes: ['Getting a permanently bad light-squared bishop', 'Passive play leading to suffocation', 'Pushing pawns without adequate piece support'],
      tip: 'Learn to handle the "bad bishop" — your light-squared bishop. Find ways to activate it or trade it off. The French is about patience.'
    }
  ];

  const openingsHtml = openings.map((op, i) => {
    const advHtml = op.advantages.map(a => `<li>${a}</li>`).join('');
    const movesHtml = op.commonMoves.map(m => `<li>${m}</li>`).join('');
    const mistakesHtml = op.commonMistakes.map(m => `<li>${m}</li>`).join('');

    return `
      <div class="learning-opening-card learning-hover-scale" id="opening-${i}">
        <div class="learning-opening-header">
          <span class="learning-opening-icon">${op.icon}</span>
          <div class="learning-opening-meta">
            <h4>${op.name}</h4>
            <div class="learning-opening-badges">
              ${renderDifficultyBadge(op.difficulty)}
              <span class="learning-moves-badge">${op.moves}</span>
            </div>
          </div>
        </div>
        <div class="learning-opening-body">
          <p class="learning-opening-explanation">${op.explanation}</p>
          <div class="learning-opening-detail">
            <div class="learning-detail-item">
              <span class="learning-detail-label">🎯 Main Idea</span>
              <p>${op.mainIdea}</p>
            </div>
            <div class="learning-detail-item">
              <span class="learning-detail-label">✅ Advantages</span>
              <ul>${advHtml}</ul>
            </div>
            <div class="learning-detail-item">
              <span class="learning-detail-label">♟ Common Moves</span>
              <ul>${movesHtml}</ul>
            </div>
            <div class="learning-detail-item">
              <span class="learning-detail-label">⚠ Common Mistakes</span>
              <ul>${mistakesHtml}</ul>
            </div>
            <div class="learning-detail-item learning-tip-box">
              <span class="learning-detail-label">💡 Practical Tip</span>
              <p>${op.tip}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="learning-section-content">
      <p class="learning-intro-text">Learn the most important chess openings that every player should know. Each opening is explained with its main ideas, common variations, and practical tips to help you play with confidence.</p>
      <div class="learning-openings-grid">
        ${openingsHtml}
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// CHESS TACTICS
// ──────────────────────────────────────────────

function renderTactics() {
  const tactics = [
    {
      name: 'Fork',
      icon: '🍴',
      difficulty: 'Beginner',
      description: 'A fork is when a single piece attacks two or more enemy pieces simultaneously. The opponent can only save one, allowing you to capture the other(s). Knights are excellent forking pieces due to their unique movement pattern.',
      keyIdea: 'Use one piece to attack multiple enemy pieces at once. The opponent must choose which to save, and you capture the other(s).',
      commonMistakes: 'Missing a fork because you focus only on direct threats. Always look for checks that attack multiple pieces.',
      tip: 'Knights are the best forking pieces. Position them in the center of the board where they control the most squares. A knight fork that includes the enemy king is devastating.',
      difficulty: 'Beginner'
    },
    {
      name: 'Pin',
      icon: '📌',
      difficulty: 'Beginner',
      description: 'A pin occurs when a piece cannot move without exposing a more valuable piece (usually the king or queen) behind it. The pinned piece is "frozen" and often becomes a target for further attacks.',
      keyIdea: 'Attack an enemy piece that is shielding a more valuable piece behind it. That piece is paralyzed and can be targeted.',
      commonMistakes: 'Forgetting that a pinned piece still provides checking power and can still capture. Also, not recognizing when you yourself are pinned.',
      tip: 'Absolute pins (where the king is behind) are the most powerful. Use bishops and rooks along files/diagonals to create pins. Once a piece is pinned, attack it further.',
      difficulty: 'Beginner'
    },
    {
      name: 'Skewer',
      icon: '🔗',
      difficulty: 'Beginner',
      description: 'A skewer is like a reverse pin: you attack a valuable piece (king or queen) along a line, and when it moves, the less valuable piece behind it is captured. Skewers often win material.',
      keyIdea: 'Attack a valuable piece on a line (rank, file, or diagonal). When it moves away, capture the piece behind it.',
      commonMistakes: 'Playing into a skewer by placing your king in front of your queen on the same diagonal or file.',
      tip: 'Rooks and bishops are the best skewering pieces. Always look for aligned enemy pieces — if the king and queen are on the same diagonal, a bishop skewer wins the queen.',
      difficulty: 'Beginner'
    },
    {
      name: 'Discovered Attack',
      icon: '💥',
      difficulty: 'Intermediate',
      description: 'A discovered attack happens when you move one piece, revealing an attack by another piece behind it. This is one of the most powerful tactical motifs because the moving piece can also create a threat.',
      keyIdea: 'Move a piece that is blocking an attack line. The revealed piece attacks, and the moving piece often creates a second threat — a "double attack."',
      commonMistakes: 'Only looking at the piece you moved and missing the discovered attack from the piece behind.',
      tip: 'A discovered check (revealing a check) is the most powerful form. The moving piece can go anywhere, including capturing a queen, because the opponent must respond to the check.',
      difficulty: 'Intermediate'
    },
    {
      name: 'Double Attack',
      icon: '⚡',
      difficulty: 'Intermediate',
      description: 'A double attack is any move that creates two or more simultaneous threats. This can be done by a single piece (like a fork) or by multiple pieces (like a discovered attack).',
      keyIdea: 'Create two threats at once. Your opponent can only respond to one threat, allowing you to succeed with the other.',
      commonMistakes: 'Creating double attacks that are too easy to defend. The best double attacks target undefended pieces or checkmate threats.',
      tip: 'Look for checks that also threaten material, or captures that also create a new threat. The queen is excellent at creating double attacks because of her ranged movement.',
      difficulty: 'Intermediate'
    },
    {
      name: 'Removing the Defender',
      icon: '🔪',
      difficulty: 'Intermediate',
      description: 'This tactic involves capturing or driving away an enemy piece that is defending another piece or a key square. Once the defender is gone, the previously protected target becomes vulnerable.',
      keyIdea: 'Identify which enemy piece is protecting another. Capture it or chase it away, then capture the now-undefended target.',
      commonMistakes: 'Not recognizing when a piece is overloaded (defending too many things). Also, exchanging defenders when the trade is unfavorable.',
      tip: 'Look for pieces that are "overloaded" — defending two important things at once. Remove the defender by capturing it, trading it off, or attacking it with a less valuable piece.',
      difficulty: 'Intermediate'
    }
  ];

  const tacticsHtml = tactics.map(t => {
    return `
      <div class="learning-tactic-card learning-hover-scale">
        <div class="learning-tactic-header">
          <span class="learning-tactic-icon">${t.icon}</span>
          <div class="learning-tactic-meta">
            <h4>${t.name}</h4>
            ${renderDifficultyBadge(t.difficulty)}
          </div>
        </div>
        <p class="learning-tactic-desc">${t.description}</p>
        <div class="learning-tactic-details">
          <div class="learning-detail-item">
            <span class="learning-detail-label">🎯 Key Idea</span>
            <p>${t.keyIdea}</p>
          </div>
          <div class="learning-detail-item">
            <span class="learning-detail-label">⚠ Common Mistake</span>
            <p>${t.commonMistakes}</p>
          </div>
          <div class="learning-detail-item learning-tip-box">
            <span class="learning-detail-label">💡 Practical Tip</span>
            <p>${t.tip}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="learning-section-content">
      <p class="learning-intro-text">Chess tactics are short-term sequences that win material or deliver checkmate. Mastering these six fundamental tactics will significantly improve your game. Study each one and practice recognizing them in your games.</p>
      <div class="learning-tactics-grid">
        ${tacticsHtml}
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// ENDGAME
// ──────────────────────────────────────────────

function renderEndgame() {
  // King + Queen vs King position
  const kqPosition = Array(8).fill(null).map(() => Array(8).fill(null));
  kqPosition[0][0] = 'bK';
  kqPosition[7][7] = 'wK';
  kqPosition[7][3] = 'wQ';

  // King + Rook vs King position
  const krPosition = Array(8).fill(null).map(() => Array(8).fill(null));
  krPosition[0][0] = 'bK';
  krPosition[7][7] = 'wK';
  krPosition[7][4] = 'wR';

  const endgames = [
    {
      icon: '♕',
      title: 'King and Queen vs King',
      desc: 'The easiest basic checkmate. The queen and king work together to trap the enemy king on the edge of the board. The key is to avoid stalemate.',
      board: kqPosition,
      principles: [
        'Bring your king close to support the queen',
        'Use the queen to restrict the enemy king to the edge',
        'Deliver checkmate with the queen supported by your king',
        'Be careful not to stalemate the enemy king!'
      ]
    },
    {
      icon: '♖',
      title: 'King and Rook vs King',
      desc: 'Harder than queen checkmate because the rook is weaker. You need to use your king actively to help the rook force the enemy king to the edge.',
      board: krPosition,
      principles: [
        'Use the "opposition" to push the enemy king back',
        'Keep your king in front of the enemy king',
        'The rook checks from the side or file to cut off escape',
        'Progress in a "box" pattern, shrinking the area each time'
      ]
    },
    {
      icon: '♙',
      title: 'Basic Pawn Endgames',
      desc: 'Pawn endgames are all about king activity and pawn promotion. The "square rule" helps you know if your king can catch an enemy pawn before it promotes.',
      board: null,
      principles: [
        'The "Rule of the Square": draw an imaginary square from the pawn to the promotion rank. If the enemy king is inside the square, it can catch the pawn.',
        'King activity is crucial — an active king is worth a pawn in the endgame',
        'Passed pawns (pawns with no enemy pawns in front) are extremely powerful',
        'Zugzwang (having to move when you don\'t want to) often decides pawn endgames'
      ]
    },
    {
      icon: '👑',
      title: 'Opposition',
      desc: 'Opposition is a fundamental king-and-pawn endgame concept. Two kings face each other with one square between them. The side that does NOT have to move has the advantage.',
      board: null,
      principles: [
        'When kings face off with one square between them, the side to move loses ground',
        'Distinguish between direct opposition (1 square), diagonal opposition, and distant opposition',
        'Use opposition to penetrate with your king or to block the enemy king',
        'Mastering opposition is essential for winning many pawn endgames'
      ]
    }
  ];

  const endgamesHtml = endgames.map(e => {
    const principlesList = e.principles.map(p => `<li>${p}</li>`).join('');
    const boardHtml = e.board ? renderMiniBoard('boardEndgame', e.board, '140px') : '';
    return `
      <div class="learning-topic-card learning-hover-scale learning-endgame-card">
        <div class="learning-endgame-layout">
          ${boardHtml ? `<div class="learning-endgame-board">${boardHtml}</div>` : ''}
          <div class="learning-topic-content">
            <h4 class="learning-topic-title">${e.icon} ${e.title}</h4>
            <p class="learning-topic-desc">${e.desc}</p>
            <div class="learning-detail-item" style="margin-top:8px;">
              <span class="learning-detail-label">📋 Key Principles</span>
              <ul class="learning-principles-list">${principlesList}</ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="learning-section-content">
      <p class="learning-intro-text">The endgame is where games are won and lost. Understanding these fundamental endgame concepts will dramatically improve your results. Practice these endgames against the AI to build confidence.</p>
      <div class="learning-endgames-grid">
        ${endgamesHtml}
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// AI COACH TIPS
// ──────────────────────────────────────────────

function renderCoachTips() {
  const tips = [
    {
      icon: '⚠️',
      title: 'Common Mistakes',
      color: '#f87171',
      items: [
        'Moving the same piece multiple times in the opening wastes valuable development time',
        'Bringing the queen out too early makes it a target for enemy pieces',
        'Neglecting king safety — castle early (before move 10) in most games',
        'Trading pieces when you are behind in development helps your opponent\'s cramped position',
        'Playing without a plan — every move should have a concrete purpose'
      ]
    },
    {
      icon: '🎯',
      title: 'Accuracy Improvement',
      color: '#4ade80',
      items: [
        'Before each move, check: "Does this move hang a piece or leave my king exposed?"',
        'Calculate 2–3 moves ahead for every critical position — look for checks, captures, and threats',
        'Use the process of elimination: find the best candidate moves, then narrow down',
        'Review your lost games with the Queen Chess analysis tool — identify where you went wrong',
        'Practice tactical puzzles daily — 10–15 minutes of tactics improves calculation speed'
      ]
    },
    {
      icon: '📖',
      title: 'Opening Recommendations',
      color: '#60a5fa',
      items: [
        'Start with 1.e4 as White — leads to open, tactical positions that teach chess fundamentals',
        'As Black, learn the Italian Game (1.e4 e5) and the Sicilian Defense (1.e4 c5) for open games',
        'Against 1.d4, the Queen\'s Gambit Declined (1.d4 d5 2.c4 e6) is a solid choice for beginners',
        'Focus on opening principles (develop, control center, castle) rather than memorizing long lines',
        'Study your own games to see which openings suit your style — aggressive or positional'
      ]
    },
    {
      icon: '🧠',
      title: 'Tactical Training Suggestions',
      color: '#c084fc',
      items: [
        'Master the "Big Four" tactics: forks, pins, skewers, and discovered attacks — they appear in every game',
        'Practice "remove the defender" puzzles — they train you to identify hidden piece relationships',
        'Solve checkmate-in-2 and checkmate-in-3 puzzles to improve pattern recognition',
        'Use the Queen Chess analysis to review tactical opportunities you missed during your games',
        'Set a goal: solve 20–30 tactics puzzles per day for 30 days — you will see dramatic improvement'
      ]
    }
  ];

  const tipsHtml = tips.map(t => {
    const itemsHtml = t.items.map(item => `<li class="learning-tip-list-item">${item}</li>`).join('');
    return `
      <div class="learning-coach-card learning-hover-scale" style="--accent-color:${t.color}">
        <div class="learning-coach-header" style="background:${t.color}10;border-bottom:2px solid ${t.color}20;">
          <span class="learning-coach-icon">${t.icon}</span>
          <h4 style="color:${t.color}">${t.title}</h4>
        </div>
        <div class="learning-coach-body">
          <ul class="learning-tip-list">${itemsHtml}</ul>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="learning-section-content">
      <div class="learning-intro-text">
        <p>Queen Chess AI analyzes your games and provides personalized recommendations. Here are general insights to help you improve faster. Play regularly, review your games with our AI analysis, and focus on one area at a time.</p>
      </div>
      <div class="learning-coach-grid">
        ${tipsHtml}
      </div>
      <div class="learning-practice-cta">
        <div class="learning-cta-content">
          <h3>🎮 Ready to Practice?</h3>
          <p>Apply what you\'ve learned by playing a game with Queen Chess AI. Use the analysis tool after each game to see where you can improve.</p>
          <button class="learning-cta-btn" onclick="loadPlay()">♟ Start a Game</button>
        </div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// MAIN LEARNING PAGE
// ──────────────────────────────────────────────

const LEARNING_SECTIONS = [
  { id: 'basics', title: 'Chess Basics', icon: '♟', renderFn: renderChessBasics, openByDefault: true },
  { id: 'openings', title: 'Chess Openings', icon: '📖', renderFn: renderOpenings, openByDefault: false },
  { id: 'tactics', title: 'Chess Tactics', icon: '⚡', renderFn: renderTactics, openByDefault: false },
  { id: 'endgame', title: 'Endgame', icon: '🏁', renderFn: renderEndgame, openByDefault: false },
  { id: 'coach', title: 'AI Coach Tips', icon: '🤖', renderFn: renderCoachTips, openByDefault: false }
];

/**
 * Main entry point — renders the complete Learning page.
 */
export function loadLearning() {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  const sectionsHtml = LEARNING_SECTIONS.map(sec =>
    renderCollapsible(sec.id, sec.title, sec.renderFn(), sec.icon, sec.openByDefault)
  ).join('');

  contentEl.innerHTML = `
    <div class="learning-page">
      <div class="learning-hero">
        <div class="learning-hero-content">
          <h1>📚 Learn Chess</h1>
          <p>Master chess from the fundamentals to advanced strategies with Queen Chess. Everything you need to improve your game — curated and explained clearly.</p>
        </div>
        <div class="learning-hero-stats">
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value">5</span>
            <span class="learning-hero-stat-label">Sections</span>
          </div>
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value">20+</span>
            <span class="learning-hero-stat-label">Topics</span>
          </div>
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value">AI</span>
            <span class="learning-hero-stat-label">Powered</span>
          </div>
        </div>
      </div>
      <div class="learning-sections-container">
        ${sectionsHtml}
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// GLOBAL TOGGLE (called from onclick)
// ──────────────────────────────────────────────

/**
 * Toggles a collapsible section open/closed with smooth animation.
 * Exposed globally for inline onclick handlers.
 */
window.toggleLearningSection = function (id) {
  const wrapper = document.getElementById(`collapsible-${id}`);
  const body = document.getElementById(`collapseBody-${id}`);
  if (!wrapper || !body) return;

  const isOpen = wrapper.classList.contains('open');

  if (isOpen) {
    // Close
    body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(() => {
      body.style.maxHeight = '0px';
    });
    wrapper.classList.remove('open');
  } else {
    // Open
    body.style.maxHeight = body.scrollHeight + 'px';
    wrapper.classList.add('open');
    // After transition, set to auto so content can grow if needed
    body.addEventListener('transitionend', function handler() {
      body.style.maxHeight = 'none';
      body.removeEventListener('transitionend', handler);
    }, { once: true });
  }
};

