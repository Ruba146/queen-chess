function getKFactor(rating, gamesPlayed, streak) {
  let k;

  // لاعب جديد
  if (gamesPlayed < 20) k = 40;
  else if (rating < 1000) k = 32;
  else if (rating < 2000) k = 24;
  else if (rating < 2400) k = 16;
  else k = 10;

  // 🔥 Hot streak bonus
  if (streak >= 3) {
    k += 5;
  }

  return k;
}

function calculateElo(playerRating, opponentRating, score, gamesPlayed, streak = 0) {
  const k = getKFactor(playerRating, gamesPlayed, streak);

  const expected =
    1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

  const newRating = playerRating + k * (score - expected);

  return Math.round(newRating);
}

function getTier(rating) {
  if (rating < 800) return "Beginner";
  if (rating < 1200) return "Bronze";
  if (rating < 1600) return "Silver";
  if (rating < 2000) return "Gold";
  if (rating < 2400) return "Platinum";
  return "Master";
}

module.exports = {
  calculateElo,
  getTier
};
