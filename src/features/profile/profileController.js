import * as achievementRepository from "../../data/achievementRepository.js";
import * as scoreRepository from "../../data/scoreRepository.js";
import { profileView } from "./profileView.js";

export async function render(context) {
  const [scores, achievements] = await Promise.all([
    scoreRepository.listScoreEntriesByPlayer(context.player.id),
    achievementRepository.listAchievementsByPlayer(context.player.id)
  ]);

  return profileView({
    player: context.player,
    scores,
    achievements
  });
}

export function bind() {}
