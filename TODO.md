# TODO

- [ ] Implement prediction trigger after 10 FULL moves (20 plies) and then update after every completed move pair.
- [ ] Prevent duplicate prediction requests and avoid sending while Stockfish is thinking.
- [ ] Display detected opening on Play page and keep `state.currentOpening` synced.
- [ ] Ensure Analysis page opening matches the saved opening; apply minimal guard in server-side analysis opening detection if needed.
- [ ] Manual test: verify first prediction timing, continuous updates, and opening display consistency.

