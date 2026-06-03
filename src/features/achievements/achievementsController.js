import * as achievementRepository from "../../data/achievementRepository.js";
import { achievementsView } from "./achievementsView.js";

export async function render(context) {
  const unlocked = await achievementRepository.listAchievementsByPlayer(context.player.id);
  return achievementsView({ unlocked });
}

export function bind() {}
