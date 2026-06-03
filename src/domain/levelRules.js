import { APP_CONFIG } from "../config/appConfig.js";

const TITLE_TIERS = [
  { level: 1, title: "Calouro do Caos" },
  { level: 2, title: "Aprendiz de Role" },
  { level: 3, title: "Bardo da Mesa" },
  { level: 5, title: "Cavaleiro do After" },
  { level: 8, title: "Arquimago da Zoeira" },
  { level: 12, title: "Lenda do Pix Compartilhado" }
];

export function calculateLevel(xp = 0) {
  return Math.max(1, Math.floor(Number(xp || 0) / APP_CONFIG.levelXpStep) + 1);
}

export function xpForNextLevel(level) {
  return Math.max(0, Number(level || 1) * APP_CONFIG.levelXpStep);
}

export function getTitlesForLevel(level) {
  return TITLE_TIERS.filter((tier) => level >= tier.level).map((tier) => tier.title);
}

export function getPrimaryTitle(player) {
  const titles = player?.titles || [];
  return titles.length ? titles[titles.length - 1] : "Figurante Lendario";
}

export function getNextTitleInfo(currentLevel) {
  const nextTier = TITLE_TIERS.find((tier) => tier.level > currentLevel);
  return nextTier || null;
}
