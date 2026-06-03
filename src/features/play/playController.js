import * as scoreRepository from "../../data/scoreRepository.js";
import * as categoryRepository from "../../data/categoryRepository.js";
import * as playerRepository from "../../data/playerRepository.js";
import * as achievementRepository from "../../data/achievementRepository.js";
import { generateSidekickCode, validateSidekickCode, getActiveSidekickCodes } from "../../services/sidekickService.js";
import { syncScoreToFirestore } from "../../services/firebaseService.js";
import { showToast, showToastAndRedirect } from "../../services/notificationService.js";
import { assertEventCanReceiveScore } from "../../domain/eventRules.js";
import { getCategoryPoints, getSidekickPoints, getXpFromScores } from "../../domain/scoreRules.js";
import { calculateLevel, getTitlesForLevel } from "../../domain/levelRules.js";
import { getNewAchievements } from "../../domain/achievementRules.js";
import { createId } from "../../utils/ids.js";
import { nowIso } from "../../utils/time.js";
import { SCORE_TYPES } from "../../utils/constants.js";
import { playView } from "./playView.js";

export async function render(context) {
  const activeCodes = getActiveSidekickCodes(context.player.id);
  return playView({
    categories: context.categories,
    event: context.event,
    activeCodes
  });
}

export function bind(context) {
  document.querySelectorAll("[data-pontuar-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dialog = document.getElementById("pontuar-dialog");
      const hiddenInput = document.getElementById("pontuar-category-id");
      if (dialog && hiddenInput) {
        hiddenInput.value = btn.dataset.pontuarCategory;
        dialog.showModal();
      }
    });
  });

  document.getElementById("confirm-generate-btn")?.addEventListener("click", async () => {
    const categoryId = document.getElementById("pontuar-category-id")?.value;
    if (!categoryId) return;

    try {
      const event = context.event;
      assertEventCanReceiveScore(event);

      const sidekickCode = generateSidekickCode({
        generatorPlayerId: context.player.id,
        categoryId,
        eventId: event.id
      });

      const dialog = document.getElementById("pontuar-dialog");
      if (dialog && dialog.open) dialog.close();

      showToast(`Codigo ${sidekickCode.code} gerado! Valido por 15s.`, "success");

      // Delay refresh to allow toast to be visible
      setTimeout(() => context.refresh(), 400);
    } catch (error) {
      const dialog = document.getElementById("pontuar-dialog");
      if (dialog && dialog.open) dialog.close();
      showToast(error.message, "error");
    }
  });

  document.getElementById("validate-sidekick-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const rawCode = form.get("sidekickCode");

    try {
      const event = context.event;
      assertEventCanReceiveScore(event);

      const codeEntry = validateSidekickCode(rawCode, context.player.id);
      const category = await categoryRepository.getCategoryById(codeEntry.categoryId);
      if (!category) throw new Error("Categoria nao encontrada.");

      const createdAt = nowIso();
      const actionPoints = getCategoryPoints(category);
      const sidekickPoints = getSidekickPoints(actionPoints);

      const actionScore = await scoreRepository.addScoreEntry({
        id: createId("score"),
        playerId: context.player.id,
        eventId: event.id,
        categoryId: codeEntry.categoryId,
        points: actionPoints,
        type: SCORE_TYPES.ACTION,
        validatedBy: codeEntry.generatorPlayerId,
        createdAt,
        metadata: {
          validationCodeId: codeEntry.code,
          categoryName: category.name
        }
      });

      const sidekickScore = await scoreRepository.addScoreEntry({
        id: createId("score"),
        playerId: codeEntry.generatorPlayerId,
        eventId: event.id,
        categoryId: codeEntry.categoryId,
        points: sidekickPoints,
        type: SCORE_TYPES.SIDEKICK,
        validatedBy: codeEntry.generatorPlayerId,
        createdAt,
        metadata: {
          validationCodeId: codeEntry.code,
          targetPlayerId: context.player.id,
          categoryName: category.name
        }
      });

      await applyProgress(context.player.id);
      await applyProgress(codeEntry.generatorPlayerId);

      syncScoreToFirestore(actionScore);
      syncScoreToFirestore(sidekickScore);

      showToastAndRedirect(
        `+${actionPoints} XP! Sidekick tambem pontuou +${sidekickPoints} XP.`,
        "success",
        context.navigate
      );
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  if (getActiveSidekickCodes(context.player.id).length > 0) {
    context.scheduleRefresh(1000);
  }
}

async function applyProgress(playerId) {
  const [player, scores, existingAchievements] = await Promise.all([
    playerRepository.getPlayerById(playerId),
    scoreRepository.listScoreEntriesByPlayer(playerId),
    achievementRepository.listAchievementsByPlayer(playerId)
  ]);

  if (!player) return null;

  const xp = getXpFromScores(scores);
  const level = calculateLevel(xp);
  const titles = getTitlesForLevel(level);
  const updatedPlayer = await playerRepository.updatePlayer({ ...player, xp, level, titles });

  const newAchievements = getNewAchievements(updatedPlayer, scores, existingAchievements);
  for (const achievement of newAchievements) {
    await achievementRepository.unlockAchievement({ playerId, ...achievement });
  }

  return updatedPlayer;
}
