# TODO - Stockfish flow + post-game analysis

## Plan approval
- [x] Confirm implementation approach (no build blocking)


## Stockfish flow optimization
- [ ] Add a single-flight Stockfish command id / state gate to ensure exactly one `go` => one `bestmove` handling
- [ ] Prevent duplicate listener attachment for hint/review flows
- [ ] Ensure engine reset/stop does not leave pending flags inconsistent
- [ ] Keep UI responsive (no synchronous waits)

## Restore analysis functionality
- [ ] Ensure Analysis tab runs move-by-move analysis automatically after game ends
- [ ] Ensure Moves tab renders and functions correctly
- [ ] Ensure AI Performance Report remains intact

## Verify by manual testing
- [ ] Play one full game and measure responsiveness
- [ ] Confirm per-move AI latency ~0.5–1.5s
- [ ] Confirm exactly one bestmove per go
- [ ] Confirm no duplicate searches running

## Build (after all code changes)
- [ ] Run npm run build and fix any build errors

