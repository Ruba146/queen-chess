# TODO — Premium SaaS Learning page + Bug Fixes

**Goal:**
- Rebuild the Learning page using the **Premium SaaS design** (same as Home/Quiz/Premium pages, built from the reusable UI kit).
- Keep ALL backend integrations and AI modules.
- Use real backend data wherever it exists; keep original Premium mock/demo content as fallback.
- Do NOT show empty states unless a module cannot function without backend data.
- Fix the Opening Explorer black screen (invalid chess.js/FEN usage).
- Fix the Profile page black screen (shared EmptyState/LoadingState/ErrorState undefined `chess-*` CSS vars).
- Do NOT redesign Home, Quiz, or Premium.

## Steps

- [x] Investigate current state (Learning page renders legacy portal; Premium components deleted & unrecoverable; backend dashboard API exists; chess.js v1.x API differences; shared components use undefined CSS vars).
- [x] Fix shared components: EmptyState, LoadingState, ErrorState → use valid UI-kit Tailwind classes (fixes Profile black screen globally).
- [x] Fix LearningBoard: safe FEN default + guard invalid FEN (fixes Explorer/Endgame crash).
- [x] Fix OpeningExplorer: valid default FEN, correct chess.js v1.x move API (remove `sloppy`).
- [x] Fix EndgameLab: valid default FEN, guard invalid FEN.
- [x] Rebuild Learning/index.jsx as Premium SaaS page:
  - Hero (welcome + real dashboard data)
  - Progress cards (Level, XP, Streak, Win Rate, Avg Accuracy, Games) — real data + mock fallback
  - Continue Learning (recentGame / mock)
  - Learning Paths (dashboard learningProgress / mock)
  - Featured Lessons (mock demo content)
  - Daily Challenge / Today's Plan (todayGoal, todayTraining / mock)
  - Suggested Lessons (recentRecommendation / mock)
  - Personal Training Plan (todayTraining / mock)
  - Achievements (mock demo content)
  - AI Learning Tools section integrating all AI modules (AICoach, AI Chess Coach, Opening Search, Opening Explorer, Endgame Lab, Tactics Trainer, Puzzle Trainer, Learning Path, Master Games)
- [x] Verify all routes build & run without runtime errors (Home, Play, Analysis, Learning, Quiz, Profile, Premium).
- [x] Build client (`vite build`) to confirm no compile errors — passed (2316 modules, no errors).
- [x] Verified chess.js v1.x usage across Play/Analysis/Learning/hooks — all use valid `new Chess()` / FEN-guarded constructors; no `sloppy` option remains.
- [x] Verified Profile page: shared EmptyState/LoadingState/ErrorState now use valid UI-kit Tailwind classes (no undefined CSS vars) — fixes the black screen.
- [x] Verified Learning/index.jsx: Premium SaaS page with all sections + real dashboard data + mock fallbacks + all AI modules preserved.
\>