const { generateCoachPlan } = require("../ai/aiExplanationService");
const { generateLearningPathSummary } = require("../ai/aiExplanationService");

async function generateLearningPath(profile) {
  const rating = profile?.rating || 1200;
  const accuracy = profile?.avgAccuracy || 0;
  const consistencyScore = profile?.consistencyScore || 50;
  const tacticalScore = profile?.tacticalAbilityScore || 50;
  const openingScore = profile?.openingScore || 50;
  const endgameScore = profile?.endgameQualityScore || 50;
  const gamesPlayed = profile?.gamesPlayed || 0;
  const favoriteOpening = profile?.favoriteOpening || "Unknown";

  const focusAreas = [];
  if (tacticalScore < 60) focusAreas.push("tactics");
  if (openingScore < 60) focusAreas.push("openings");
  if (endgameScore < 60) focusAreas.push("endgames");
  if (consistencyScore < 60) focusAreas.push("consistency");
  if (focusAreas.length === 0) focusAreas.push("tactics");

  const nextMilestone = rating < 800 ? 1000 : rating < 1200 ? 1400 : rating < 1600 ? 1800 : 2000;
  const dailyMinutes = rating < 1000 ? 20 : rating < 1400 ? 30 : 45;

  let planNarrative = "";
  try {
    const plan = await generateCoachPlan({
      username: profile?.username || "Player",
      rating,
      avgAccuracy: accuracy,
      consistencyScore,
      blunderRate: profile?.blunderRate || 0,
      tacticalAbilityScore: tacticalScore,
      positionalPlayScore: profile?.positionalPlayScore || 50,
      openingScore,
      endgameQualityScore: endgameScore,
      gamesPlayed,
      favoriteOpening,
      decisionMakingScore: profile?.decisionMakingScore || 50,
    });
    planNarrative = plan.summary || "Learning path generated.";
  } catch {
    planNarrative = `Current Rating: ${rating}. Strengths: ${focusAreas.filter(f => f !== "tactics").join(", ") || "N/A"}. Weaknesses: ${focusAreas.filter(f => f === "tactics").join(", ") || "N/A"}. Today's Focus: ${focusAreas[0]}. Weekly Goal: reach ${nextMilestone} rating. Next Target: ${nextMilestone}.`;
  }

  return {
    currentRating: rating,
    focusAreas,
    goals: {
      daily: [`Complete 10 puzzles focused on ${focusAreas[0]}`],
      weekly: [`Reach ${nextMilestone} rating`, `Improve ${focusAreas[0]} accuracy by 5%`],
      monthly: [`Stabilize at ${nextMilestone + 200} rating`],
    },
    dailyStudyMinutes: dailyMinutes,
    studyPlan: {
      narrative: planNarrative,
      nextMilestone,
      focusAreas,
    },
  };
}

module.exports = { generateLearningPath };
