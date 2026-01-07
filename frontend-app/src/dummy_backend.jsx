/**
 * Backend API call for score calculation.
 * Calls the /vote endpoint to update user's stance score.
 * 
 * @param {number} currentSelfScore - The current score of the user (-100 to 100).
 * @param {string} opinionId - The ID of the opinion being voted on.
 * @param {string} voteType - 'agree' or 'oppose'.
 * @returns {Promise<number>} The new calculated self score.
 */
export const calculateNewScore = async (currentSelfScore, opinionId, voteType) => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  // ログイン中のユーザーIDを取得
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.warn('User not logged in. Cannot calculate score.');
    throw new Error('ログインが必要です');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/news/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
      },
      body: JSON.stringify({
        currentScore: currentSelfScore,
        opinionId: opinionId,
        voteType: voteType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.newScore;
  } catch (error) {
    console.warn('Failed to calculate new score via API:', error);
    throw error; // エラーを再スローして呼び出し元で処理
  }
};
