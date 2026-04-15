const sessions = new Map();

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SESSIONS = 500;

function set(sessionId, data) {
  // Evict oldest session if at capacity
  if (!sessions.has(sessionId) && sessions.size >= MAX_SESSIONS) {
    let oldestId = null;
    let oldestTime = Infinity;
    for (const [id, entry] of sessions) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestId = id;
      }
    }
    if (oldestId) sessions.delete(oldestId);
  }
  sessions.set(sessionId, { ...data, createdAt: Date.now() });
}

function get(sessionId) {
  const entry = sessions.get(sessionId);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return undefined;
  }
  return entry;
}

function has(sessionId) {
  return get(sessionId) !== undefined;
}

// Periodic cleanup of expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of sessions) {
    if (now - entry.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, CLEANUP_INTERVAL_MS);

module.exports = { set, get, has };
