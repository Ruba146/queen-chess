import { useEffect, useRef, useState } from 'react'
import { Bot, Clock, Gauge } from 'lucide-react'
import PageContainer from '../../components/ui/PageContainer'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { gameApi } from '../../services/api'
import { useChessGame } from '../../hooks/useChessGame'
import PlayerCard from './PlayerCard'
import ChessBoard from './ChessBoard'
import MoveHistory from './MoveHistory'
import GameControls from './GameControls'
import Assistant from './Assistant'
import Insights from './Insights'
import StartScreen from './StartScreen'

const AI_NAME = 'Queen AI'

function PlayHeader({ displayName, difficulty, started }) {
  return (
    <section className="play-header">
      <div>
        <h1>Play</h1>
        <p>
          {started
            ? `${displayName} versus Queen AI on ${difficulty} difficulty.`
            : 'Choose your side, tune the AI difficulty, and start a premium training match.'}
        </p>
      </div>
      <div className="play-header-metrics">
        <div>
          <Gauge className="h-3.5 w-3.5 qc-text-purple" aria-hidden="true" />
          <span className="text-[10px]">{difficulty}</span>
        </div>
        <div>
          <Bot className="h-3.5 w-3.5 qc-text-gold" aria-hidden="true" />
          <span className="text-[10px]">{started ? 'In progress' : 'Ready'}</span>
        </div>
        <div>
          <Clock className="h-3.5 w-3.5 qc-text-purple" aria-hidden="true" />
          <span className="text-[10px]">Untimed</span>
        </div>
      </div>
    </section>
  )
}

function ActiveGameScreen({ chess, gameConfig, started, userRating, aiRating, displayName, playerTime, aiTime, playerCaptured, aiCaptured, onNewGame, onResign, onFlip, onHint, saveError, saveMessage }) {
  return (
    <div className="play-board-layout">
      {saveError && (
        <div
          role="alert"
          className="rounded-lg border border-[var(--qc-error)]/30 bg-[var(--qc-error)]/10 px-3 py-2 text-xs text-[var(--qc-error)]"
        >
          {saveError}
        </div>
      )}
      {saveMessage && (
        <div
          role="status"
          className="rounded-lg border border-[var(--qc-success)]/30 bg-[var(--qc-success)]/10 px-3 py-2 text-xs text-[var(--qc-success)]"
        >
          {saveMessage}
        </div>
      )}
      <aside className="play-side-panel">
        <PlayerCard
          name={displayName}
          rating={userRating ?? '-'}
          time={playerTime}
          captured={playerCaptured}
          color={gameConfig.color === 'white' ? 'White' : 'Black'}
          active={!chess.status.over && !chess.isAiThinking}
        />
        <PlayerCard
          name={AI_NAME}
          rating={aiRating}
          time={aiTime}
          captured={aiCaptured}
          color={gameConfig.color === 'white' ? 'Black' : 'White'}
          isAI
          active={chess.isAiThinking}
        />
      </aside>

      <main className="play-board-column">
        <ChessBoard
          board={chess.board}
          selectedSquare={chess.selectedSquare}
          legalTargets={chess.legalTargets}
          onSquareClick={chess.onSquareClick}
          status={chess.status}
          moveCount={chess.moves.length}
          isAiThinking={chess.isAiThinking}
        />
        <GameControls
          onNewGame={onNewGame}
          onResign={onResign}
          onFlip={onFlip}
          onHint={onHint}
          gameOver={chess.status.over}
          started={started}
          isAiThinking={chess.isAiThinking}
        />
      </main>

      <aside className="play-analysis-panel">
        <MoveHistory moves={chess.moves} />
        <Assistant
          moveCount={chess.moves.length}
          pgn={chess.pgn}
          isAiThinking={chess.isAiThinking}
          hint={chess.hint}
          hintBusy={chess.hintBusy}
          moveAnalysis={chess.moveAnalysis}
          evalHistory={chess.evalHistory}
          lastMoveQuality={chess.lastMoveQuality}
          bestMove={chess.bestMove}
          tactics={chess.tactics}
          opponentThreats={chess.opponentThreats}
          coachSections={chess.coachSections}
          liveEval={chess.liveEval}
          livePositionAnalysis={chess.livePositionAnalysis}
          analysisBusy={chess.analysisBusy}
          playerLevel={chess.playerLevel}
        />
        <Insights
          moveCount={chess.moves.length}
          capturedWhite={chess.captured.capturedByWhite}
          capturedBlack={chess.captured.capturedByBlack}
          gameStarted={started}
          moveAnalysis={chess.moveAnalysis}
        />
      </aside>
    </div>
  )
}

function Play() {
  const { user, restoreSession } = useAuth()

  const statsApi = useApi(() => gameApi.getStats('rapid').then((r) => r.data), {
    immediate: true,
  })

  const [gameConfig, setGameConfig] = useState(null)
  const [orientation, setOrientation] = useState('white')
  const [saveError, setSaveError] = useState(null)
  const [saveMessage, setSaveMessage] = useState(null)
  const saveInFlightRef = useRef(false)

  const chess = useChessGame({
    playerColor: gameConfig?.color === 'random' ? orientation : gameConfig?.color || 'white',
    difficulty: gameConfig?.difficulty || 'intermediate',
  })

  const started = Boolean(gameConfig)

  useEffect(() => {
    if (!started) return
    if (!chess.status.over) return
    if (saveInFlightRef.current) return
    saveInFlightRef.current = true
    setSaveError(null)
    setSaveMessage(null)

    const result =
      chess.status.winner === 'draw'
        ? 'draw'
        : chess.status.winner === 'White'
          ? 'White'
          : 'Black'

    const payload = {
      result,
      moves: chess.moves,
      pgn: chess.pgn,
      playerColor: gameConfig.color === 'random' ? orientation : gameConfig.color,
      difficulty: gameConfig.difficulty,
      duration: chess.durationSeconds(),
    }

    gameApi
      .save(payload)
      .then((res) => {
        setSaveMessage(
          `Game saved. Rating change: ${res.data?.ratingChange ?? 0} -> ${res.data?.newRating ?? '-'}`,
        )
        chess.setSaveResult(res.data)
        return Promise.all([statsApi.refetch(), restoreSession()])
      })
      .catch((err) => {
        setSaveError(err.message || 'Failed to save the game.')
      })
      .finally(() => {
        saveInFlightRef.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chess.status.over, started])

  const handleStart = ({ color, difficulty }) => {
    const effective = color === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : color
    setSaveError(null)
    setSaveMessage(null)
    setGameConfig({ color: effective, difficulty })
    setOrientation(effective)
    chess.reset()
  }

  const handleNewGame = () => {
    setSaveError(null)
    setSaveMessage(null)
    setGameConfig(null)
    chess.reset()
  }

  const handleHint = () => {
    chess.getHint()
  }

  const userRating = statsApi.data?.rating
  const aiRating =
    {
      beginner: 800,
      intermediate: 1200,
      advanced: 1600,
      master: 2200,
    }[gameConfig?.difficulty] || 1200

  const displayName = user?.displayName || user?.username || 'You'
  const playerTime = chess.formatClock(
    gameConfig?.color === 'white' ? chess.playerClock : chess.aiClock,
  )
  const aiTime = chess.formatClock(
    gameConfig?.color === 'white' ? chess.aiClock : chess.playerClock,
  )
  const playerCaptured =
    gameConfig?.color === 'white'
      ? chess.captured.capturedByWhite
      : chess.captured.capturedByBlack
  const aiCaptured =
    gameConfig?.color === 'white'
      ? chess.captured.capturedByBlack
      : chess.captured.capturedByWhite

  const onFlip = () => setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  const onResign = chess.resign

  return (
    <PageContainer maxWidth="max-w-[1440px]" className="play-page">
      <PlayHeader
        displayName={displayName}
        difficulty={gameConfig?.difficulty || 'intermediate'}
        started={started}
      />

      {statsApi.loading && !started ? (
        <LoadingState label="Loading player stats..." />
      ) : statsApi.error && !started ? (
        <ErrorState
          message={statsApi.error.message || 'Failed to load player stats.'}
          onRetry={() => statsApi.refetch()}
        />
      ) : !started ? (
        <StartScreen onStart={handleStart} userRating={userRating} />
      ) : (
        <ActiveGameScreen
          chess={chess}
          gameConfig={gameConfig}
          orientation={orientation}
          started={started}
          userRating={userRating}
          aiRating={aiRating}
          displayName={displayName}
          playerTime={playerTime}
          aiTime={aiTime}
          playerCaptured={playerCaptured}
          aiCaptured={aiCaptured}
          onNewGame={handleNewGame}
          onResign={onResign}
          onFlip={onFlip}
          onHint={handleHint}
          saveError={saveError}
          saveMessage={saveMessage}
        />
      )}
    </PageContainer>
  )
}

export default Play
