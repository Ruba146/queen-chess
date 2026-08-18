import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageContainer from '../../components/ui/PageContainer'
import SectionTitle from '../../components/ui/SectionTitle'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { gameApi, analysisApi } from '../../services/api'
import useReplay from '../../hooks/useReplay'
import GameList from './GameList'
import AnalysisHero from './AnalysisHero'
import ReplayBoard from './ReplayBoard'
import Performance from './Performance'
import Evaluation from './Evaluation'
import OpeningAnalysis from './OpeningAnalysis'
import MoveTimeline from './MoveTimeline'
import AIRecommendations from './AIRecommendations'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

function Analysis() {
  const [games, setGames] = useState(null)
  const [gamesLoading, setGamesLoading] = useState(true)
  const [gamesError, setGamesError] = useState(null)

  const [selectedGameId, setSelectedGameId] = useState(null)
  const [game, setGame] = useState(null)
  const [gameError, setGameError] = useState(null)
  const [gameLoading, setGameLoading] = useState(false)
  const [summary, setSummary] = useState(null)

  const cacheRef = useRef({})
  const loadingRef = useRef({})

  const loadGames = useCallback(async () => {
    setGamesLoading(true)
    setGamesError(null)
    try {
      const res = await gameApi.listMyGames()
      const list = Array.isArray(res.data) ? res.data : []
      setGames(list)
    } catch (err) {
      setGamesError(err.message || 'Failed to load your games.')
    } finally {
      setGamesLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGames()
  }, [loadGames])

  const gameList = useMemo(() => (Array.isArray(games) ? games : []), [games])
  const currentIndex = useMemo(
    () => gameList.findIndex((g) => g.id === selectedGameId),
    [gameList, selectedGameId],
  )
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < gameList.length - 1

  const goToGame = useCallback(
    (g) => {
      if (!g) return
      setSelectedGameId(g.id)
      setGame(g)
      setGameError(null)
      setGameLoading(true)
      setSummary(null)

      if (cacheRef.current[g.id]) {
        const cached = cacheRef.current[g.id]
        setGame(cached.game)
        setSummary(cached.summary)
        setGameLoading(false)
        return
      }

      if (loadingRef.current[g.id]) return
      loadingRef.current[g.id] = true

      ;(async () => {
        try {
          const res = await analysisApi.getFullAnalysis(g.id)
          const full = res.data
          cacheRef.current[g.id] = { game: { ...g, ...full }, summary: null }
          setGame({ ...g, ...full })

          try {
            const summaryRes = await analysisApi.getGameSummary(g.id)
            const nextSummary = summaryRes.data?.data || summaryRes.data || null
            cacheRef.current[g.id].summary = nextSummary
            setSummary(nextSummary)
          } catch {
            // summary error is non-critical
          }
        } catch (err) {
          setGameError(err.message || 'Failed to load analysis for this game.')
        } finally {
          setGameLoading(false)
          loadingRef.current[g.id] = false
        }
      })()
    },
    [],
  )

  const handlePrev = useCallback(() => {
    if (hasPrev) goToGame(gameList[currentIndex - 1])
  }, [hasPrev, currentIndex, gameList, goToGame])

  const handleNext = useCallback(() => {
    if (hasNext) goToGame(gameList[currentIndex + 1])
  }, [hasNext, currentIndex, gameList, goToGame])

  const handleBack = useCallback(() => {
    setSelectedGameId(null)
    setGame(null)
    setGameError(null)
    setGameLoading(false)
    setSummary(null)
  }, [])

  const moves = useMemo(() => (Array.isArray(game?.moves) ? game.moves : []), [game])
  const analysis = useMemo(() => (Array.isArray(game?.analysis) ? game.analysis : []), [game])
  const evaluationData = useMemo(
    () => (Array.isArray(game?.evaluationData) ? game.evaluationData : []),
    [game],
  )
  const replay = useReplay(moves)

  const showGameListView = !selectedGameId && !gameError

  return (
    <PageContainer maxWidth="max-w-7xl">
      <SectionTitle
        eyebrow="My Games"
        title="Review your games"
        description="Load a saved game and review the full engine analysis."
        className="mb-4"
      />

      {gamesLoading && !games ? (
        <LoadingState label="Loading your games..." />
      ) : gamesError && !games ? (
        <ErrorState message={gamesError} onRetry={loadGames} />
      ) : showGameListView ? (
        <div className="mx-auto max-w-6xl w-full">
          <GameList
            games={games}
            loading={gamesLoading}
            error={gamesError}
            selectedId={selectedGameId}
            onSelect={goToGame}
            onRetry={loadGames}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {gameError && <ErrorState message={gameError} onRetry={() => goToGame(game)} />}

          {game && (
            <>
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={handleBack}>
                  Back to My Games
                </Button>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={ChevronLeft}
                    onClick={handlePrev}
                    disabled={!hasPrev}
                  >
                    Previous
                  </Button>
                  <span className="text-[10px] qc-text-muted">
                    {currentIndex + 1} / {gameList.length}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    rightIcon={ChevronRight}
                    onClick={handleNext}
                    disabled={!hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {gameLoading ? (
                <Card className="p-8">
                  <div className="flex items-center justify-center">
                    <div className="qc-spinner" />
                  </div>
                </Card>
              ) : (
                <>
                  <AnalysisHero game={game} />

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                    <ReplayBoard replay={replay} moves={moves} analysis={analysis} game={game} />
                    <div className="flex flex-col gap-3">
                      <Performance analysis={game} />
                    </div>
                  </div>

                  <Evaluation evaluationData={evaluationData} />
                  <MoveTimeline analysis={analysis} coachRecommendations={game?.coachRecommendations} />
                  <OpeningAnalysis
                    opening={game?.opening}
                    eco={game?.eco}
                    strengths={game?.strengths}
                    weaknesses={game?.weaknesses}
                    openingScore={game?.openingScore}
                    middleGameScore={game?.middleGameScore}
                    endgameScore={game?.endgameScore}
                  />
                  <AIRecommendations summary={summary} />
                </>
              )}
            </>
          )}
        </div>
      )}
    </PageContainer>
  )
}

export default Analysis
