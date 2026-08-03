async function generateTrainingSession(profile) {
  return {
    date: new Date().toISOString().split('T')[0],
    sessionSummary: 'Training session generated.',
    components: [],
    sessionDuration: 30,
    difficulty: profile?.difficulty || 'intermediate',
    playerRating: profile?.rating || 1200,
  };
}

module.exports = { generateTrainingSession };