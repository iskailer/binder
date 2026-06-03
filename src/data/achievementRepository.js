import { DOC_TYPES } from "../utils/constants.js";
import { createId } from "../utils/ids.js";
import { nowIso } from "../utils/time.js";
import { listEntities, saveEntity } from "./db.js";

export async function unlockAchievement({ playerId, key, title, description }) {
  const achievement = {
    id: createId("achievement"),
    playerId,
    key,
    title,
    description,
    unlockedAt: nowIso()
  };

  return saveEntity(DOC_TYPES.ACHIEVEMENT, achievement);
}

export async function listAchievementsByPlayer(playerId) {
  const achievements = await listEntities(DOC_TYPES.ACHIEVEMENT);
  return achievements
    .filter((achievement) => achievement.playerId === playerId)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
}

export async function listAllAchievements() {
  return listEntities(DOC_TYPES.ACHIEVEMENT);
}
