/**
 * Mock backend logic for score calculation.
 * In a real application, this would be an API call.
 * 
 * @param {number} currentSelfScore - The current score of the user (-100 to 100).
 * @param {number} opinionScore - The score of the opinion being voted on (-100 to 100).
 * @param {string} voteType - 'agree' or 'oppose'.
 * @returns {number} The new calculated self score.
 */
export const calculateNewScore = (currentSelfScore, opinionScore, voteType) => {
  let newScore = currentSelfScore;
  const weight = 0.2; // Movement weight

  if (voteType === 'agree') {
    // Move towards the opinion
    newScore = currentSelfScore + (opinionScore - currentSelfScore) * weight;
  } else if (voteType === 'oppose') {
    // Move away. 
    // If opinion is positive (e.g. 80), opposing it should move towards negative.
    // If opinion is negative (e.g. -80), opposing it should move towards positive.
    // Simple logic: Move towards -opinionScore
    const targetScore = -opinionScore;
    newScore = currentSelfScore + (targetScore - currentSelfScore) * weight;
  }

  // Clamp score between -100 and 100
  newScore = Math.max(-100, Math.min(100, newScore));

  return newScore;
};
