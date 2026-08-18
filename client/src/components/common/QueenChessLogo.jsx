import './QueenChessLogo.css'

export default function QueenChessLogo({ className = '' }) {
  return (
    <div className={`queen-chess-logo ${className}`}>
      <img
        src="/images/queen-chess-logo-sidebar.png"
        alt="Queen Chess"
        className="queen-chess-logo__image"
        draggable={false}
      />
    </div>
  )
}
