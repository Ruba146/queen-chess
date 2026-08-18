import {
  Swords,
  Puzzle,
  Castle,
  Bot,
  Trophy,
  Flame,
  Target,
  Shield,
  Crown,
  Zap,
} from 'lucide-react'

export const CATEGORY_META = {
  'daily-challenge': { title: 'Daily Challenge', icon: Flame, difficulty: 'Mixed', time: '5 min', tone: 'warning', description: 'A fresh puzzle every day.' },
  'openings': { title: 'Opening Training', icon: Swords, difficulty: 'Beginner', time: '8 min', tone: 'primary', description: 'Practice common opening tactics.' },
  'middlegame': { title: 'Middlegame', icon: Target, difficulty: 'Intermediate', time: '12 min', tone: 'accent', description: 'Tactical middlegame positions.' },
  'endgames': { title: 'Endgame', icon: Castle, difficulty: 'Intermediate', time: '10 min', tone: 'success', description: 'Master essential endgame techniques.' },
  'tactics': { title: 'Tactical Training', icon: Puzzle, difficulty: 'Intermediate', time: '12 min', tone: 'warning', description: 'Sharpen your tactical vision.' },
  'best-move': { title: 'Best Move', icon: Zap, difficulty: 'Intermediate', time: '10 min', tone: 'primary', description: 'Find the strongest continuation.' },
  'defensive-move': { title: 'Defensive Move', icon: Shield, difficulty: 'Advanced', time: '12 min', tone: 'danger', description: 'Find the best defensive resource.' },
  'mate-in-1': { title: 'Mate in 1', icon: Crown, difficulty: 'Beginner', time: '5 min', tone: 'warning', description: 'Deliver checkmate in one move.' },
  'mate-in-2': { title: 'Mate in 2', icon: Crown, difficulty: 'Intermediate', time: '8 min', tone: 'warning', description: 'Find the forced mate in two.' },
  'mate-in-3': { title: 'Mate in 3', icon: Crown, difficulty: 'Advanced', time: '12 min', tone: 'danger', description: 'Calculate the deep mating sequence.' },
  'master-games': { title: 'Master Games', icon: Trophy, difficulty: 'Expert', time: '15 min', tone: 'accent', description: 'Puzzles from master-level games.' },
  'survival-mode': { title: 'Survival', icon: Flame, difficulty: 'Mixed', time: '15 min', tone: 'danger', description: 'How long can you survive?' },
  'ai-challenge': { title: 'AI Challenge', icon: Bot, difficulty: 'Expert', time: '15 min', tone: 'accent', description: 'AI-generated puzzles at your level.' },
  'weekly-challenge': { title: 'Weekly Challenge', icon: Trophy, difficulty: 'Mixed', time: '20 min', tone: 'danger', description: 'A new challenge every week.' },
}

export function getCategoryMeta(slug) {
  return CATEGORY_META[slug] || { title: slug, icon: Puzzle, difficulty: 'Mixed', time: '10 min', tone: 'neutral', description: '' }
}
