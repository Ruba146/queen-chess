async function generateQuizSession(options) {
  return {
    id: `session-${Date.now().toString(36)}`,
    category: options.category || 'mixed',
    questionCount: 0,
    questions: [],
    createdAt: new Date().toISOString(),
    description: 'Quiz session.',
  };
}

function getClassicPositions(category, count) {
  const allPositions = [
    { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', goal: 'Find the best move', category: 'openings', difficulty: 'beginner', rating: 800, solution: ['O-O'] },
    { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', goal: 'Find the best move', category: 'tactics', difficulty: 'intermediate', rating: 1200, solution: ['Nxe5'] },
    { fen: '8/8/8/3k4/8/2K5/4P3/8 w - - 0 1', goal: 'Promote the pawn', category: 'endgames', difficulty: 'beginner', rating: 800, solution: ['Kd3'] },
  ];

  let filtered = category === 'mixed' ? allPositions : allPositions.filter(p => p.category === category);
  if (filtered.length === 0) filtered = allPositions;
  return filtered.slice(0, count);
}

module.exports = { generateQuizSession, getClassicPositions };