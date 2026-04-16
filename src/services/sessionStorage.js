/**
 * sessionStorage.js — Browser-based session archive
 * Stores completed courtroom session transcripts in localStorage.
 */

const STORAGE_KEY = 'courtroom_sessions';

/**
 * Save a completed session to the archive.
 * @param {Object} session
 */
export function saveSession({ caseData, selectedSide, difficulty, arguments: args, roundScores, verdict }) {
  const sessions = getSessions();

  const newSession = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    caseName: caseData?.shortName || 'Unknown Case',
    caseId: caseData?.id || '',
    year: caseData?.year || '',
    side: selectedSide,
    difficulty: difficulty || 'medium',
    winner: verdict?.winner || 'unknown',
    userTotal: verdict?.userTotal || 0,
    aiTotal: verdict?.aiTotal || 0,
    rounds: roundScores.length,
    transcript: args.map(a => ({
      side: a.side,
      text: a.text,
      round: a.round,
    })),
  };

  sessions.unshift(newSession); // newest first

  // Keep max 50 sessions
  const trimmed = sessions.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  return newSession;
}

/**
 * Get all saved sessions.
 */
export function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Delete a session by ID.
 */
export function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Clear all sessions.
 */
export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}
