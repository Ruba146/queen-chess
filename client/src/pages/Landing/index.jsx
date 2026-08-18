import { useState } from 'react'
import { motion } from 'framer-motion'
import { NavLink, Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import ChessPiece from '../../components/chess/ChessPiece'
import QueenChessLogo from '../../components/common/QueenChessLogo'

const PIECE_SET = {
  white: [
    { type: 'r', row: 7, col: 0, color: 'w' }, { type: 'n', row: 7, col: 1, color: 'w' }, { type: 'b', row: 7, col: 2, color: 'w' },
    { type: 'q', row: 7, col: 3, color: 'w' }, { type: 'k', row: 7, col: 4, color: 'w' }, { type: 'b', row: 7, col: 5, color: 'w' },
    { type: 'n', row: 7, col: 6, color: 'w' }, { type: 'r', row: 7, col: 7, color: 'w' },
    { type: 'p', row: 6, col: 0, color: 'w' }, { type: 'p', row: 6, col: 1, color: 'w' }, { type: 'p', row: 6, col: 2, color: 'w' },
    { type: 'p', row: 6, col: 3, color: 'w' }, { type: 'p', row: 6, col: 4, color: 'w' }, { type: 'p', row: 6, col: 5, color: 'w' },
    { type: 'p', row: 6, col: 6, color: 'w' }, { type: 'p', row: 6, col: 7, color: 'w' },
  ],
  black: [
    { type: 'r', row: 0, col: 0, color: 'b' }, { type: 'n', row: 0, col: 1, color: 'b' }, { type: 'b', row: 0, col: 2, color: 'b' },
    { type: 'q', row: 0, col: 3, color: 'b' }, { type: 'k', row: 0, col: 4, color: 'b' }, { type: 'b', row: 0, col: 5, color: 'b' },
    { type: 'n', row: 0, col: 6, color: 'b' }, { type: 'r', row: 0, col: 7, color: 'b' },
    { type: 'p', row: 1, col: 0, color: 'b' }, { type: 'p', row: 1, col: 1, color: 'b' }, { type: 'p', row: 1, col: 2, color: 'b' },
    { type: 'p', row: 1, col: 3, color: 'b' }, { type: 'p', row: 1, col: 4, color: 'b' }, { type: 'p', row: 1, col: 5, color: 'b' },
    { type: 'p', row: 1, col: 6, color: 'b' }, { type: 'p', row: 1, col: 7, color: 'b' },
  ],
}

function ChessBoard({ size = 320, pieces = PIECE_SET, moved = {} }) {
  const cellSize = size / 8
  const cells = []
  const whites = pieces.white || []
  const blacks = pieces.black || []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0
      const pieceKey = `${row},${col}`
      const movedPiece = moved[pieceKey]
      const basePiece = !movedPiece && (whites.find(p => p.row === row && p.col === col) || blacks.find(p => p.row === row && p.col === col))
      const piece = movedPiece || basePiece
      cells.push(
        <div
          key={pieceKey}
          className={`qc-landing-board-cell ${isLight ? 'light' : 'dark'} ${movedPiece ? 'glow' : ''}`}
          style={{ width: cellSize, height: cellSize }}
        >
          {piece && <ChessPiece type={piece.type} color={piece.color || (piece.row >= 4 ? 'w' : 'b')} size={cellSize * 0.82} />}
        </div>
      )
    }
  }
  return (
    <div className="qc-landing-board" style={{ width: size, height: size, gridTemplateColumns: `repeat(8, ${cellSize}px)` }}>
      {cells}
    </div>
  )
}

function LandingNavbar() {
  const [open, setOpen] = useState(false)
  const links = [
    { to: '#features', label: 'Features' },
    { to: '/register', label: 'Play' },
    { to: '/register', label: 'AI Analysis' },
    { to: '/register', label: 'Learning' },
    { to: '/register', label: 'Puzzles' },
  ]
  return (
    <nav className="qc-landing-nav">
      <div className="qc-landing-nav-inner qc-landing-container">
        <Link to="/landing" className="flex items-center no-underline">
          <QueenChessLogo className="queen-chess-logo--header" />
        </Link>
        <div className="qc-landing-nav-links">
          {links.map(link => (
            <NavLink key={link.label} to={link.to} className="text-xs font-semibold text-[var(--qc-text-secondary)] hover:text-[var(--qc-text-primary)] transition-colors no-underline">
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="outline" size="sm">Log In</Button>
          </Link>
          <Link to="/register" className="hidden sm:inline-block">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
          <button className="sm:hidden text-[var(--qc-text-secondary)] p-1" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
        {open && (
          <div className="qc-landing-mobile-menu sm:hidden">
            {links.map(link => (
              <NavLink key={link.label} to={link.to} className="block text-sm py-2 text-[var(--qc-text-secondary)] hover:text-[var(--qc-text-primary)] no-underline" onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            <div className="flex flex-col gap-2 mt-2">
              <Link to="/login" onClick={() => setOpen(false)}><Button variant="outline" fullWidth size="sm">Log In</Button></Link>
              <Link to="/register" onClick={() => setOpen(false)}><Button variant="primary" fullWidth size="sm">Get Started</Button></Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="qc-landing-hero">
      <div className="qc-landing-hero-glow" />
      <motion.div className="qc-landing-hero-content" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <div className="qc-landing-hero-badge">
          <span className="qc-landing-hero-badge-dot" aria-hidden="true" />
          AI Chess Training Suite
        </div>
        <h1 className="qc-landing-hero-title">
          Train Smarter.<br />
          <span className="qc-landing-hero-accent">Play Stronger.</span>
        </h1>
        <p className="qc-landing-hero-sub">
          Sharpen your skills with AI-powered training, master every game, and improve with every move.
        </p>
        <div className="qc-landing-hero-actions">
          <Link to="/register"><Button variant="primary" size="lg">Get Started</Button></Link>
          <a href="#features"><Button variant="secondary" size="lg">Explore Queen Chess</Button></a>
        </div>
      </motion.div>
      <motion.div className="qc-landing-hero-visual" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <div className="qc-landing-hero-board-wrap">
          <ChessBoard size={320} />
          <div className="qc-landing-hero-piece qc-landing-hero-piece--queen" aria-hidden="true">♛</div>
          <div className="qc-landing-hero-piece qc-landing-hero-piece--knight" aria-hidden="true">♞</div>
        </div>
      </motion.div>
    </section>
  )
}

function PlayChessSection() {
  const moved = { '4,4': { type: 'p', row: 4, col: 4, color: 'w' }, '3,3': { type: 'p', row: 3, col: 3, color: 'b' } }
  return (
    <section className="qc-landing-section">
      <div className="qc-landing-section-reverse">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }} className="flex flex-col gap-4">
          <Badge tone="accent" size="sm">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--qc-text-primary)] leading-tight">Play Chess Your Way</h2>
          <p className="text-sm sm:text-base text-[var(--qc-text-secondary)] leading-relaxed">
            Challenge our adaptive AI opponents at any level. From casual games to intense training matches, Queen Chess adapts to your style and helps you grow with every move.
          </p>
          <Link to="/register"><Button variant="primary" size="md">Play Chess</Button></Link>
        </motion.div>
        <motion.div className="qc-landing-visual" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Card hover className="p-3 rounded-2xl border border-[var(--qc-purple)]/20 shadow-[0_0_24px_rgba(122,53,212,0.12)]">
            <ChessBoard size={300} moved={moved} />
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

function AIAnalysisSection() {
  return (
    <section className="qc-landing-section">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        <motion.div className="qc-landing-visual lg:order-1" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Card hover className="p-4 rounded-2xl border border-[var(--qc-border-strong)] w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[var(--qc-text-muted)] uppercase tracking-wider">Analysis</span>
              <Badge tone="primary" size="sm">Active</Badge>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--qc-success)]" />
              <span className="text-xs font-semibold text-[var(--qc-text-secondary)]">Evaluation: <span className="text-[var(--qc-text-primary)] font-bold">+0.8</span></span>
            </div>
            <div className="flex gap-2 mb-3">
              <span className="px-2 py-1 rounded-md bg-[rgba(122,53,212,0.12)] border border-[rgba(122,53,212,0.24)] text-xs font-bold text-[var(--qc-gold)]">Best: Nf3</span>
              <span className="px-2 py-1 rounded-md bg-[rgba(255,255,255,0.04)] border border-[var(--qc-border)] text-xs text-[var(--qc-text-muted)]">Considered: Bd3</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-[var(--qc-error)]" /><span className="text-[var(--qc-text-secondary)]">Inaccuracy at move 12</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-[var(--qc-warning)]" /><span className="text-[var(--qc-text-secondary)]">Mistake at move 18</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-[var(--qc-success)]" /><span className="text-[var(--qc-text-secondary)]">Brilliant move at move 24</span></div>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }} className="flex flex-col gap-4 lg:order-2">
          <Badge tone="accent" size="sm">AI Analysis</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--qc-text-primary)] leading-tight">Understand Every Move</h2>
          <p className="text-sm sm:text-base text-[var(--qc-text-secondary)] leading-relaxed">
            Get deep, move-by-move AI analysis of your games. Identify mistakes, discover better alternatives, and learn the strategic ideas behind top-level play.
          </p>
          <Link to="/register"><Button variant="primary" size="md">Analyze Your Game</Button></Link>
        </motion.div>
      </div>
    </section>
  )
}

function AICoachSection() {
  const modules = [
    { icon: '♟', title: 'Chess Basics' },
    { icon: '♞', title: 'Piece Movements' },
    { icon: '♜', title: 'Essential Rules' },
    { icon: '⚡', title: 'Tactics' },
    { icon: '📖', title: 'Openings' },
    { icon: '🏁', title: 'Endgames' },
  ]
  return (
    <section className="qc-landing-section">
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Badge tone="primary" size="sm">AI Coach</Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[var(--qc-text-primary)]">Train With Your AI Coach</h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--qc-text-secondary)] max-w-2xl mx-auto">
            Personalized lessons that adapt to your skill level. From your first move to advanced strategy, your AI coach is with you every step.
          </p>
        </motion.div>
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          {modules.map(m => (
            <Card key={m.title} hover className="p-3 rounded-xl border border-[var(--qc-border)] text-center cursor-pointer">
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="text-xs font-bold text-[var(--qc-text-primary)]">{m.title}</div>
            </Card>
          ))}
        </motion.div>
        <motion.div className="mt-8 text-center" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Link to="/register"><Button variant="primary" size="md">Start Learning</Button></Link>
        </motion.div>
    </section>
  )
}

function PuzzlesSection() {
  const puzzlePieces = {
    white: [{ type: 'q', row: 5, col: 3, color: 'w' }, { type: 'k', row: 7, col: 4, color: 'w' }],
    black: [{ type: 'k', row: 5, col: 5, color: 'b' }, { type: 'r', row: 3, col: 7, color: 'b' }],
  }
  return (
    <section className="qc-landing-section">
      <div className="qc-landing-section-reverse">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }} className="flex flex-col gap-4">
          <Badge tone="accent" size="sm">Puzzles</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--qc-text-primary)] leading-tight">Sharpen Your Chess Skills</h2>
          <p className="text-sm sm:text-base text-[var(--qc-text-secondary)] leading-relaxed">
            Solve thousands of tactical puzzles that adapt to your rating. Improve pattern recognition, calculation, and precision with every session.
          </p>
          <Link to="/register"><Button variant="primary" size="md">Practice Now</Button></Link>
        </motion.div>
        <motion.div className="qc-landing-visual" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Card hover className="p-4 rounded-2xl border border-[var(--qc-border-strong)] w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <Badge tone="primary" size="sm">Tactics</Badge>
              <span className="text-xs font-bold text-[var(--qc-gold)]">Puzzle #4821</span>
            </div>
            <div className="flex justify-center mb-3">
              <ChessBoard size={240} pieces={puzzlePieces} />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= 3 ? 'bg-[var(--qc-success)]' : 'bg-[var(--qc-border)]'}`} />
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

function ProgressSection() {
  const features = [
    { icon: '📊', label: 'Rating Tracking', desc: 'Monitor your rating across all modes' },
    { icon: '🏆', label: 'Level System', desc: 'Earn XP and level up your skills' },
    { icon: '✨', label: 'Daily XP', desc: 'Complete training to earn rewards' },
    { icon: '🔥', label: 'Streaks', desc: 'Build consistency with daily practice' },
    { icon: '🎯', label: 'Accuracy', desc: 'Track move precision over time' },
    { icon: '♟', label: 'Game Analysis', desc: 'Deep review of every match' },
    { icon: '🤖', label: 'AI Coaching', desc: 'Personalized training plans' },
  ]
  return (
    <section className="qc-landing-section">
      <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Badge tone="primary" size="sm">Progress</Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[var(--qc-text-primary)]">Your Progress, Your Journey</h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--qc-text-secondary)] max-w-2xl mx-auto">
            Track your improvement with detailed stats, streaks, and achievements. See how far you've come and where to focus next.
          </p>
        </motion.div>
        <motion.div className="qc-landing-stat-grid" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          {features.map(s => (
            <Card key={s.label} hover className="p-4 rounded-2xl border border-[var(--qc-border)] text-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-xl font-extrabold text-[var(--qc-text-primary)]">{s.label}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--qc-text-muted)] mt-1">{s.desc}</div>
            </Card>
          ))}
        </motion.div>
    </section>
  )
}

function FinalCTASection() {
  return (
    <section className="qc-landing-cta">
      <motion.div className="text-center" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--qc-text-primary)] leading-tight">Ready to Become a Better Chess Player?</h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--qc-text-secondary)] max-w-xl mx-auto">Play smarter. Learn faster. Understand your game.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button variant="primary" size="lg">Get Started</Button></Link>
            <Link to="/login"><Button variant="secondary" size="lg">Log In</Button></Link>
          </div>
        </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="qc-landing-footer">
      <div className="qc-landing-footer-inner qc-landing-container">
        <div className="flex items-center gap-2">
          <QueenChessLogo className="queen-chess-logo--mark" />
          <span className="font-bold text-xs tracking-widest text-[var(--qc-text-primary)]">QUEEN CHESS</span>
        </div>
        <p className="text-xs text-[var(--qc-text-muted)]">© 2026 Queen Chess. All rights reserved.</p>
        <div className="flex gap-4">
          {['About', 'Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#" className="text-xs text-[var(--qc-text-muted)] hover:text-[var(--qc-text-secondary)] no-underline transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}

function LandingLayout() {
  return (
    <div className="qc-landing">
      <LandingNavbar />
      <main className="qc-landing-container">
        <HeroSection />
        <PlayChessSection />
        <AIAnalysisSection />
        <AICoachSection />
        <PuzzlesSection />
        <ProgressSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}

export default function Landing() {
  return <LandingLayout />
}
