import { DOC_TYPES } from "../utils/constants.js";
import { listEntities, saveEntity } from "./db.js";

export async function addScoreEntry(scoreEntry) {
  return saveEntity(DOC_TYPES.SCORE_ENTRY, scoreEntry);
}

export async function listScoreEntries() {
  const scores = await listEntities(DOC_TYPES.SCORE_ENTRY);
  return scores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function listScoreEntriesByEvent(eventId) {
  const scores = await listScoreEntries();
  return scores.filter((score) => score.eventId === eventId);
}

export async function listScoreEntriesByPlayer(playerId) {
  const scores = await listScoreEntries();
  return scores.filter((score) => score.playerId === playerId);
}

export async function hasScoreForValidation(validationCodeId) {
  const scores = await listScoreEntries();
  return scores.some((score) => score.metadata?.validationCodeId === validationCodeId);
}
