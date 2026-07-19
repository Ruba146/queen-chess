# TODO - Frontend refactor: dual Stockfish engines + exact-10-plies prediction

## Step 1: Inspect + identify current failure points
- [x] Read existing Stockfish worker wiring (`frontend/js/stockfish.js`)
- [x] Read current gameplay flow (`frontend/js/game.js`)
- [x] Read current post-game analysis flow (`frontend/js/analysis.js`)

## Step 2: Implement dual independent engine architecture
- [ ] Update `frontend/js/state.js` to hold separate engine state for:
  - [ ] gameEngine (gameplay)
  - [ ] analysisEngine (post-game)
- [ ] Refactor `frontend/js/stockfish.js` to:
  - [ ] create per-engine Worker instances
  - [ ] keep per-engine ready flags + per-engine queues
  - [ ] keep per-engine listener lists
  - [ ] prevent cross-engine races/single-flight issues
  - [ ] expose init/post/stop APIs that are engine-type safe

## Step 3: Restore gameplay completely
- [ ] Update `frontend/js/game.js` to use only `gameEngine`
- [ ] Fix any waiting/timer/listener duplication issues
- [ ] Ensure Stockfish returns bestmove and gameplay proceeds every move

## Step 4: Prediction after exactly 10 plies (no interrupt)
- [ ] Implement one-shot prediction trigger when `history().length === 10`
- [ ] Call existing prediction API asynchronously
- [ ] Display:
  - [ ] Predicted Winner
  - [ ] White Win %
  - [ ] Black Win %
  - [ ] Draw %
  - [ ] Confidence
- [ ] Ensure prediction does not cause duplicate calls / freeze

## Step 5: Post-game analysis (separate analysis engine)
- [ ] Update `frontend/js/analysis.js` to:
  - [ ] use only `analysisEngine`
  - [ ] run sequential analysis for every move
  - [ ] render Best Move, Evaluation, Classification
  - [ ] render Accuracy % + AI Performance Report
- [ ] Preserve Analysis tab + Moves tab behavior

## Step 6: Cleanups
- [ ] Remove obsolete/debug code paths
- [ ] Remove duplicate listeners and race conditions

## Step 7: Build + test
- [ ] Run build
- [ ] Fix all build errors
- [ ] Play complete game
- [ ] Verify:
  - [ ] gameplay loop
  - [ ] prediction appears exactly once at 10 plies
  - [ ] analysis starts only after game ends
  - [ ] tabs and all existing functionality work

## Step 8: Reporting
- [ ] Summarize every modified file and changes

