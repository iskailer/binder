import { SCORE_TYPES } from "../utils/constants.js";

/**
 * Calculates end-of-night titles based on event score statistics.
 * Each title goes to the player who best fits the criteria.
 *
 * @param {Array} scores - All score entries for the event
 * @param {Array} players - All players (for name resolution)
 * @param {Array} participantIds - IDs of event participants
 * @returns {Array} Array of { id, title, emoji, description, playerId, playerName, stat }
 */
export function calculateEndOfNightTitles(scores = [], players = [], participantIds = []) {
  if (!scores.length || !participantIds.length) return [];

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const participantSet = new Set(participantIds);

  // Only consider scores from participants
  const eventScores = scores.filter((s) => participantSet.has(s.playerId));
  const actionScores = eventScores.filter((s) => s.type === SCORE_TYPES.ACTION);
  const sidekickScores = eventScores.filter((s) => s.type === SCORE_TYPES.SIDEKICK);

  const titles = [];

  // 🏆 Rei do Beijo — most points in "beijar" category
  const reiDoBeijo = findTopPlayerByCategory(actionScores, "beijar", playerMap);
  if (reiDoBeijo) {
    titles.push({
      id: "rei-do-beijo",
      title: "Rei do Beijo",
      emoji: "💋",
      description: "Mais pontos na categoria Beijar",
      playerId: reiDoBeijo.playerId,
      playerName: reiDoBeijo.playerName,
      stat: `${reiDoBeijo.count}x beijou`
    });
  }

  // 🥤 Hidratado — most "tomar-refrigerante" scores
  const hidratado = findTopPlayerByCategory(actionScores, "tomar-refrigerante", playerMap);
  if (hidratado) {
    titles.push({
      id: "hidratado",
      title: "Hidratado",
      emoji: "🥤",
      description: "Mais refrigerantes tomados",
      playerId: hidratado.playerId,
      playerName: hidratado.playerName,
      stat: `${hidratado.count}x hidratou`
    });
  }

  // 👮 Fiscal do Rolê — most validations as sidekick (generated codes for others)
  const fiscal = findTopSidekick(sidekickScores, playerMap);
  if (fiscal) {
    titles.push({
      id: "fiscal-do-role",
      title: "Fiscal do Role",
      emoji: "👮",
      description: "Mais validacoes como sidekick",
      playerId: fiscal.playerId,
      playerName: fiscal.playerName,
      stat: `${fiscal.count}x validou`
    });
  }

  // 🚀 Foguete — fastest scorer (smallest average interval between scores)
  const foguete = findFastestScorer(actionScores, playerMap);
  if (foguete) {
    titles.push({
      id: "foguete",
      title: "Foguete",
      emoji: "🚀",
      description: "Pontuou mais rapido (menor intervalo entre scores)",
      playerId: foguete.playerId,
      playerName: foguete.playerName,
      stat: `intervalo medio ${foguete.avgIntervalStr}`
    });
  }

  // 🦁 Leão de Chácara — first to score AND last to score in the event
  const leao = findLeaoDeChacara(actionScores, playerMap);
  if (leao) {
    titles.push({
      id: "leao-de-chacara",
      title: "Leao de Chacara",
      emoji: "🦁",
      description: "Primeiro a pontuar e ultimo a pontuar",
      playerId: leao.playerId,
      playerName: leao.playerName,
      stat: "abriu e fechou a noite"
    });
  }

  return titles;
}

/**
 * Find the player with the most ACTION scores in a specific category.
 */
function findTopPlayerByCategory(actionScores, categoryId, playerMap) {
  const counts = new Map();

  for (const score of actionScores) {
    if (score.categoryId === categoryId) {
      const current = counts.get(score.playerId) || 0;
      counts.set(score.playerId, current + 1);
    }
  }

  if (counts.size === 0) return null;

  let topPlayerId = null;
  let topCount = 0;
  for (const [playerId, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topPlayerId = playerId;
    }
  }

  const player = playerMap.get(topPlayerId);
  if (!player || topCount === 0) return null;

  return { playerId: topPlayerId, playerName: player.name, count: topCount };
}

/**
 * Find the player with the most SIDEKICK scores (validated most codes for others).
 */
function findTopSidekick(sidekickScores, playerMap) {
  const counts = new Map();

  for (const score of sidekickScores) {
    const current = counts.get(score.playerId) || 0;
    counts.set(score.playerId, current + 1);
  }

  if (counts.size === 0) return null;

  let topPlayerId = null;
  let topCount = 0;
  for (const [playerId, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topPlayerId = playerId;
    }
  }

  const player = playerMap.get(topPlayerId);
  if (!player || topCount === 0) return null;

  return { playerId: topPlayerId, playerName: player.name, count: topCount };
}

/**
 * Find the player with the smallest average interval between their ACTION scores.
 * Requires at least 2 scores to calculate an interval.
 */
function findFastestScorer(actionScores, playerMap) {
  // Group scores by player, sorted by time
  const byPlayer = new Map();
  for (const score of actionScores) {
    if (!byPlayer.has(score.playerId)) byPlayer.set(score.playerId, []);
    byPlayer.get(score.playerId).push(score);
  }

  let bestPlayerId = null;
  let bestAvgMs = Infinity;

  for (const [playerId, scores] of byPlayer) {
    if (scores.length < 2) continue;

    // Sort by createdAt ascending
    const sorted = scores.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let totalInterval = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalInterval += new Date(sorted[i].createdAt) - new Date(sorted[i - 1].createdAt);
    }
    const avgMs = totalInterval / (sorted.length - 1);

    if (avgMs < bestAvgMs) {
      bestAvgMs = avgMs;
      bestPlayerId = playerId;
    }
  }

  if (!bestPlayerId) return null;

  const player = playerMap.get(bestPlayerId);
  if (!player) return null;

  const avgIntervalStr = formatInterval(bestAvgMs);
  return { playerId: bestPlayerId, playerName: player.name, avgIntervalStr };
}

/**
 * Find the player who scored first AND last in the event.
 * If no single player did both, returns null.
 */
function findLeaoDeChacara(actionScores, playerMap) {
  if (actionScores.length < 2) return null;

  const sorted = actionScores.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const firstPlayerId = sorted[0].playerId;
  const lastPlayerId = sorted[sorted.length - 1].playerId;

  if (firstPlayerId !== lastPlayerId) return null;

  const player = playerMap.get(firstPlayerId);
  if (!player) return null;

  return { playerId: firstPlayerId, playerName: player.name };
}

/**
 * Format milliseconds interval into a readable string.
 */
function formatInterval(ms) {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ""}`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return `${hours}h${remainMin > 0 ? ` ${remainMin}m` : ""}`;
}
