import { useState } from 'react'
import { Chess } from 'chess.js'
import LearningBoard from './LearningBoard'

const MASTER_GAMES = [
  {
    id: 'kasparov-topalov',
    title: 'Kasparov vs Topalov, 1999',
    description: 'One of the greatest attacking games ever played. Kasparov sacrifices his rook to launch a devastating attack on the black king.',
    moves: 'e4 d6 d4 Nf6 Nc3 g6 Be3 Bg7 Qd2 c6 f3 b5 Nge2 Nbd7 Bd3 Bb7 O-O-O Qa5 Kb1 a6 Ng1 O-O c4 b4 Ne4 c5 cxb5 axb5 Nxb5 cxd4 Bxd4 Bxd4 Nxd4 Rxa2 Kxa2 Qa4+ Kb1 Qxb4 Nc6 Qb3 Nxd7 Nxd7 Bd6 Nc5 Bxf8 Rxf8 Qd4 Nxd4 Bxd4 Qxd4 Nxd4 Rxd4 exd4 Kg7 Rc1 f6 Rc7 Kf7 Rxf7 Kxf7 Nf5 gxf5 Rxf5+ Ke6 Rf6+ Kd5 Rxb6 e5 dxe5 dxe5 Rxe5+ Kc4 Rxa6 Bc8 a3 Bxa6 Nxa6 Kb3 Nc5 Kc3 Ne4 Kb3 Nd2 h4 h5 Ng3 Nf3 Nf5 Ne5 Ke3 Kc3 Kd3 Kd4 Ne3 Nc6+ Kc3 Ne5+ Kd3 Nf3+ Ke3 Ng1 Kf4 Nh3+ Kg3 Nf4 Kh4 g5+ hxg5 hxg5+ Kh5 g4 Nxg4 Nxg4 Kxg4',
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    event: 'Wijk aan Zee',
    year: '1999',
    result: '1-0',
  },
  {
    id: 'immortal-game',
    title: 'Anderssen vs Kieseritzky, 1851',
    description: 'The "Immortal Game". Adolf Anderssen sacrifices his queen, two rooks, and both bishops to deliver checkmate.',
    moves: 'e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Qxf4 Qxf4 Rxf4 h6 g5 hxg5 Bxg5 Nbd7 hxg6 Nxg6 Rxf8+ Kxf8 Nxg6+ Ke8 Nxe7+ Kd8 Bxd7+ Nxd7 Nxd7+ Kxd7 Bxf8 Ke6 Bxe5 Ne3 Rf1 Ng4 Ke2 Bc5+ d4 Bxd4+ Kd3 Bxe5+ Ke2 Bxf8 Kf3 Bxg6 Kxg6 Bxd7 Kxh7 Bf5 Kh8 Bg6+ Kh7 Bf5+ Kh8 Bg6+ Kh7 Bf5+ Kh8 Bg6+',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    event: 'London',
    year: '1851',
    result: '1-0',
  },
  {
    id: 'operation-chesstown',
    title: 'Deep Blue vs Kasparov, 1997',
    description: 'The historic match where IBM\'s Deep Blue defeated the world champion, marking a milestone in AI history.',
    moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2 e5 Nb3 Be7 O-O O-O Be3 Be6 Qd3 Nbd7 a4 Rc8 a5 Qc7 Rfd1 Nb6 Bxb6 Qxb6 Nd5 Bxd5 exd5 Nxd5 c4 Nxe3 fxe3 Bxa5 Bxa5 Rxa5 Qxa5 Rxa5 cxb5 Rxb5 Rc1 Rxb5 cxb5 h6 Kf1 Kf8 Ke2 Ke7 Kd3 Kd7 Kc4 Kc6 Kb4 a5+ Kxa5 Kd5 b3 f6 b4 e4+ Kxe4 fxe4 Rxe4+ Kc6 Re3 Kc5 Re8 Kxb4 Rg8 a5 Rxg7 a4 Rxf7 a3 Kd4 b5 Kc5 a2 Kd6 a1=Q Ke7 Qc4+ Kf7 Qxb5+ Kg7 Qc6+ Kh7 Qc7+ Kh8 Qc8+ Kh7 Qc7+ Kh8 Qc8+',
    white: 'Deep Blue',
    black: 'Garry Kasparov',
    event: 'New York City',
    year: '1997',
    result: '1-0',
  },
]

function MasterGames() {
  const [selectedGame, setSelectedGame] = useState(MASTER_GAMES[0])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [chess, setChess] = useState(() => new Chess())

  const loadGame = (game) => {
    setSelectedGame(game)
    setCurrentMoveIndex(0)
    const newChess = new Chess()
    setChess(newChess)
  }

  const goToMove = (index) => {
    if (index < 0 || index > selectedGame.moves.split(' ').length) return
    const newChess = new Chess()
    const moves = selectedGame.moves.split(' ').slice(0, index)
    for (const move of moves) {
      try {
        newChess.move(move)
      } catch {
        // skip invalid moves
      }
    }
    setChess(newChess)
    setCurrentMoveIndex(index)
  }

  const allMoves = selectedGame.moves.split(' ')
  const currentMoves = allMoves.slice(0, currentMoveIndex)

  return (
    <div className="learning-tool-shell">
      <div className="learning-tool-controls">
        <select
          className="learning-control-select"
          value={selectedGame.id}
          onChange={(e) => loadGame(MASTER_GAMES.find(g => g.id === e.target.value))}
        >
          {MASTER_GAMES.map((game) => (
            <option key={game.id} value={game.id}>
              {game.white} vs {game.black}, {game.year}
            </option>
          ))}
        </select>
      </div>

      <div className="learning-explorer-layout">
        <div>
          <LearningBoard fen={chess.fen()} />
          <div className="learning-board-actions">
            <button
              type="button"
              onClick={() => goToMove(currentMoveIndex - 1)}
              disabled={currentMoveIndex === 0}
              className="disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs qc-text-secondary">
              Move {currentMoveIndex} / {allMoves.length}
            </span>
            <button
              type="button"
              onClick={() => goToMove(currentMoveIndex + 1)}
              disabled={currentMoveIndex >= allMoves.length}
              className="disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="learning-move-strip">
            {currentMoves.map((m, i) => (
              <span key={i} className={`learning-move-pill ${i % 2 === 0 ? 'active' : ''}`}>
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="learning-analysis-panel">
          <h4>{selectedGame.title}</h4>
          <div className="mt-2 space-y-1.5">
            <p className="text-xs qc-text-secondary">
              <strong className="qc-text-primary">White:</strong> {selectedGame.white}
            </p>
            <p className="text-xs qc-text-secondary">
              <strong className="qc-text-primary">Black:</strong> {selectedGame.black}
            </p>
            <p className="text-xs qc-text-secondary">
              <strong className="qc-text-primary">Event:</strong> {selectedGame.event}, {selectedGame.year}
            </p>
            <p className="text-xs qc-text-secondary">
              <strong className="qc-text-primary">Result:</strong> {selectedGame.result}
            </p>
          </div>
          <div className="mt-3">
            <h5 className="text-xs font-semibold qc-text-primary">Game Summary</h5>
            <p className="text-xs qc-text-secondary">{selectedGame.description}</p>
          </div>
          <div className="mt-3">
            <h5 className="text-xs font-semibold qc-text-primary">Moves</h5>
            <div className="max-h-32 overflow-y-auto rounded-md border qc-border qc-bg-card p-2">
              <p className="text-[11px] qc-text-secondary font-mono break-all">
                {allMoves.map((m, i) => (
                  <span key={i} className={i % 2 === 0 ? 'qc-text-gold' : 'qc-text-muted'}>
                    {i % 2 === 0 && <span className="qc-text-muted">{Math.floor(i / 2) + 1}.</span>}{' '}
                    {m}{' '}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterGames

