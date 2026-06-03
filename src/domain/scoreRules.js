import { APP_CONFIG } from "../config/appConfig.js";
import { SCORE_TYPES } from "../utils/constants.js";

export function getCategoryPoints(category) {
  return Number(category?.points || 0);
}

export function getSidekickPoints(actionPoints) {
  const raw = Math.ceil(Number(actionPoints || 0) * APP_CONFIG.sidekickRate);
  return Math.max(APP_CONFIG.sidekickMinPoints, Math.min(APP_CONFIG.sidekickMaxPoints, raw));
}

export function getXpFromScores(scoreEntries = []) {
  return scoreEntries.reduce((total, entry) => total + Number(entry.points || 0), 0);
}

export function isActionScore(scoreEntry) {
  return scoreEntry?.type === SCORE_TYPES.ACTION;
}

export function isSidekickScore(scoreEntry) {
  return scoreEntry?.type === SCORE_TYPES.SIDEKICK;
}
