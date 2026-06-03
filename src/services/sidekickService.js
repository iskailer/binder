import { APP_CONFIG } from "../config/appConfig.js";
import { getRandomToken } from "../utils/ids.js";
import { nowIso, addSecondsIso, isPastIso } from "../utils/time.js";

const activeSidekickCodes = new Map();

export function generateSidekickCode({ generatorPlayerId, categoryId, eventId }) {
  const code = getRandomToken(6);
  const createdAt = nowIso();
  const expiresAt = addSecondsIso(createdAt, APP_CONFIG.codeTtlSeconds);

  const sidekickCode = {
    code,
    generatorPlayerId,
    categoryId,
    eventId,
    createdAt,
    expiresAt,
    used: false
  };

  activeSidekickCodes.set(code, sidekickCode);

  setTimeout(() => {
    const existing = activeSidekickCodes.get(code);
    if (existing && !existing.used) {
      activeSidekickCodes.delete(code);
    }
  }, APP_CONFIG.codeTtlSeconds * 1000);

  return sidekickCode;
}

export function validateSidekickCode(rawCode, consumerPlayerId) {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const entry = activeSidekickCodes.get(code);

  if (!entry) {
    throw new Error("Codigo nao encontrado ou expirado.");
  }

  if (entry.used) {
    throw new Error("Codigo ja utilizado.");
  }

  if (isPastIso(entry.expiresAt)) {
    activeSidekickCodes.delete(code);
    throw new Error("Codigo expirou. Peca outro ao parceiro.");
  }

  if (entry.generatorPlayerId === consumerPlayerId) {
    throw new Error("Voce nao pode usar seu proprio codigo.");
  }

  entry.used = true;
  activeSidekickCodes.delete(code);

  return entry;
}

export function getActiveSidekickCodes(generatorPlayerId) {
  const now = nowIso();
  const codes = [];
  for (const [key, entry] of activeSidekickCodes) {
    if (entry.generatorPlayerId === generatorPlayerId && !entry.used && !isPastIso(entry.expiresAt, now)) {
      codes.push(entry);
    }
  }
  return codes;
}

export function cleanExpiredCodes() {
  const now = nowIso();
  for (const [key, entry] of activeSidekickCodes) {
    if (isPastIso(entry.expiresAt, now)) {
      activeSidekickCodes.delete(key);
    }
  }
}
