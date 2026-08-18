const gameService = require("../services/gameService");

async function getStats(req, res) {
  try {
    const result = await gameService.getStats(req.user, req.params.mode);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function saveGame(req, res) {
  try {
    const result = await gameService.saveGame(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listMyGames(req, res) {
  try {
    const take = req.query.take ? parseInt(req.query.take, 10) : undefined;
    const games = await gameService.listMyGames(req.user.id, { take });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getGameById(req, res) {
  try {
    const game = await gameService.getGameById(req.params.id);
    res.json(game);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  getStats,
  saveGame,
  listMyGames,
  getGameById,
};