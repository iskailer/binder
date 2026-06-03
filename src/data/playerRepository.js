import { DOC_TYPES } from "../utils/constants.js";
import { createId } from "../utils/ids.js";
import { nowIso } from "../utils/time.js";
import { listEntities, getEntity, saveEntity } from "./db.js";

export async function createPlayer({ name, avatarType, firebaseUid = null }) {
  const createdAt = nowIso();
  const player = {
    id: createId("player"),
    name,
    avatarType,
    firebaseUid,
    xp: 0,
    level: 1,
    titles: ["Calouro do Caos"],
    createdAt,
    lastSeenAt: createdAt
  };

  return saveEntity(DOC_TYPES.PLAYER, player);
}

export async function listPlayers() {
  const players = await listEntities(DOC_TYPES.PLAYER);
  return players.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function getPlayerById(playerId) {
  return getEntity(DOC_TYPES.PLAYER, playerId);
}

export async function getPlayerByFirebaseUid(firebaseUid) {
  if (!firebaseUid) return null;
  const players = await listPlayers();
  return players.find((p) => p.firebaseUid === firebaseUid) || null;
}

export async function updatePlayer(player) {
  return saveEntity(DOC_TYPES.PLAYER, { ...player, lastSeenAt: nowIso() });
}
