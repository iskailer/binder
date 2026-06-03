import { SCORE_TYPES } from "../utils/constants.js";

export function buildRanking(scoreEntries = [], players = [], participantIds = []) {
  const playerMap = new Map(players.map((player) => [player.id, player]));
  const rows = new Map();

  participantIds.forEach((playerId) => {
    const player = playerMap.get(playerId);
    if (player) {
      rows.set(playerId, createEmptyRow(player));
    }
  });

  scoreEntries.forEach((entry) => {
    const player = playerMap.get(entry.playerId);
    if (!player) return;

    if (!rows.has(entry.playerId)) {
      rows.set(entry.playerId, createEmptyRow(player));
    }

    const row = rows.get(entry.playerId);
    row.points += Number(entry.points || 0);
    row.entries += 1;
    row.actions += entry.type === SCORE_TYPES.ACTION ? 1 : 0;
    row.sidekicks += entry.type === SCORE_TYPES.SIDEKICK ? 1 : 0;
    row.lastScoreAt = !row.lastScoreAt || new Date(entry.createdAt) > new Date(row.lastScoreAt)
      ? entry.createdAt
      : row.lastScoreAt;
  });

  return Array.from(rows.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.actions !== a.actions) return b.actions - a.actions;
    if (!a.lastScoreAt && b.lastScoreAt) return 1;
    if (a.lastScoreAt && !b.lastScoreAt) return -1;
    return new Date(a.lastScoreAt || 0).getTime() - new Date(b.lastScoreAt || 0).getTime();
  });
}

function createEmptyRow(player) {
  return {
    playerId: player.id,
    playerName: player.name,
    avatarType: player.avatarType,
    points: 0,
    entries: 0,
    actions: 0,
    sidekicks: 0,
    lastScoreAt: null
  };
}
