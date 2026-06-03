import { SCORE_TYPES } from "../utils/constants.js";

export const ACHIEVEMENT_DEFINITIONS = Object.freeze([
  {
    key: "primeira-lenda",
    title: "Primeira Lenda Local",
    description: "Pontuou pela primeira vez sem derrubar o app.",
    isUnlocked: ({ scores }) => scores.some((score) => score.type === SCORE_TYPES.ACTION)
  },
  {
    key: "fiscal-do-role",
    title: "Fiscal do Role",
    description: "Ganhou bonus sidekick validando alguem.",
    isUnlocked: ({ scores }) => scores.some((score) => score.type === SCORE_TYPES.SIDEKICK)
  },
  {
    key: "mesa-em-chamas",
    title: "Mesa em Chamas",
    description: "Chegou a 5 acoes validadas.",
    isUnlocked: ({ scores }) => scores.filter((score) => score.type === SCORE_TYPES.ACTION).length >= 5
  },
  {
    key: "centenario-do-caos",
    title: "Centenario do Caos",
    description: "Acumulou 100 XP no total.",
    isUnlocked: ({ player }) => Number(player.xp || 0) >= 100
  },
  {
    key: "refrigerante-mistico",
    title: "Refrigerante Mistico",
    description: "Pontuou na categoria Tomar um refrigerante.",
    isUnlocked: ({ scores }) => scores.some((score) => score.categoryId === "tomar-refrigerante")
  },
  {
    key: "fora-com-postura",
    title: "Fora com Postura",
    description: "Transformou um fora em estatistica oficial.",
    isUnlocked: ({ scores }) => scores.some((score) => score.categoryId === "levar-fora")
  }
]);

export function getNewAchievements(player, scores = [], existingAchievements = []) {
  const unlockedKeys = new Set(existingAchievements.map((achievement) => achievement.key));
  return ACHIEVEMENT_DEFINITIONS
    .filter((definition) => !unlockedKeys.has(definition.key))
    .filter((definition) => definition.isUnlocked({ player, scores }))
    .map(({ key, title, description }) => ({ key, title, description }));
}
