import { NavLink } from 'react-router-dom'
import { RotateCcw, Flag, Hand, Volume2, Smartphone, Bot, BookOpen } from 'lucide-react'
import Button from '../../components/ui/Button'

function GameControls({
  onNewGame,
  onResign,
  onFlip,
  onHint,
  gameOver,
  started,
  isAiThinking,
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Button
          variant="primary"
          size="sm"
          leftIcon={RotateCcw}
          onClick={onNewGame}
          disabled={!started}
        >
          New Game
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={Bot}
          onClick={onHint}
          disabled={!started || isAiThinking}
        >
          Hint
        </Button>
        <Button as={NavLink} to="/my-games" variant="outline" size="sm" leftIcon={BookOpen}>
          My Games
        </Button>
        <Button
          variant="danger"
          size="sm"
          leftIcon={Flag}
          onClick={onResign}
          disabled={!started || gameOver}
        >
          Resign
        </Button>
        <Button variant="secondary" size="sm" leftIcon={Hand} disabled={!started || gameOver}>
          Draw
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Button variant="ghost" size="sm" leftIcon={Volume2} className="text-xs">
          Sound
        </Button>
        <Button variant="ghost" size="sm" leftIcon={Smartphone} onClick={onFlip} disabled={!started} className="text-xs">
          Flip
        </Button>
      </div>
    </div>
  )
}

export default GameControls
