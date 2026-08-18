const puzzleRepository = require("../repositories/puzzleRepository");
const { getPuzzleRecommendations } = require("./recommendationEngine");
const { generateDailyTrainingExplanation } = require("../ai/aiExplanationService");

async function generateTrainingSession(profile) {
  const rating = profile?.rating || 1200;
  const difficulty = profile?.difficulty || "intermediate";
  const tacticalScore = profile?.tacticalAbilityScore || 50;
  const openingScore = profile?.openingScore || 50;
  const endgameScore = profile?.endgameQualityScore || 50;

  const puzzleRecs = await getPuzzleRecommendations({
    count: 5,
    rating,
    themes: tacticalScore < 60 ? ["tactics"] : [],
    difficulty,
  });

  const puzzles = puzzleRecs.puzzles || [];
  const tacticsComponent = puzzles.length > 0 ? { type: "tactics", puzzles, count: puzzles.length } : null;

  const sessionDate = new Date().toISOString().split("T")[0];
  const sessionDuration = rating < 1000 ? 15 : rating < 1400 ? 25 : 40;

  let explanation = null;
  try {
    explanation = await generateDailyTrainingExplanation(profile, {
      sessionSummary: "Mixed training session",
      tactical: { themes: puzzleRecs.themes },
      opening: { focus: "General opening principles" },
      endgame: { focus: ["Basic endgame technique"] },
    });
  } catch {
    explanation = null;
  }

  const components = [];
  if (tacticsComponent) components.push(tacticsComponent);

  return {
    date: sessionDate,
    sessionSummary: explanation || "Training session generated.",
    components,
    sessionDuration,
    difficulty,
    playerRating: rating,
    explanation,
  };
}

module.exports = { generateTrainingSession };
