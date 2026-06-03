import { APP_CONFIG } from "../config/appConfig.js";
import { getRandomToken } from "../utils/ids.js";
import { nowIso, addSecondsIso, isPastIso } from "../utils/time.js";
import { isFirebaseReady, getFirestore } from "./firebaseService.js";

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

  // Also push to Firestore for cross-device validation
  pushCodeToFirestore(sidekickCode);

  setTimeout(() => {
    const existing = activeSidekickCodes.get(code);
    if (existing && !existing.used) {
      activeSidekickCodes.delete(code);
      removeCodeFromFirestore(code);
    }
  }, APP_CONFIG.codeTtlSeconds * 1000);

  return sidekickCode;
}

export async function validateSidekickCode(rawCode, consumerPlayerId) {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Try local first
  let entry = activeSidekickCodes.get(code);

  // If not found locally, try Firestore (cross-device scenario)
  if (!entry) {
    entry = await pullCodeFromFirestore(code);
  }

  if (!entry) {
    throw new Error("Codigo nao encontrado ou expirado.");
  }

  if (entry.used) {
    throw new Error("Codigo ja utilizado.");
  }

  if (isPastIso(entry.expiresAt)) {
    activeSidekickCodes.delete(code);
    removeCodeFromFirestore(code);
    throw new Error("Codigo expirou. Peca outro ao parceiro.");
  }

  if (entry.generatorPlayerId === consumerPlayerId) {
    throw new Error("Voce nao pode usar seu proprio codigo.");
  }

  entry.used = true;
  activeSidekickCodes.delete(code);
  removeCodeFromFirestore(code);

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

// ─── Firestore helpers for cross-device code sharing ───

function pushCodeToFirestore(sidekickCode) {
  if (!isFirebaseReady()) return;
  try {
    const db = getFirestore();
    db.collection("sidekickCodes").doc(sidekickCode.code).set(sidekickCode);
  } catch (error) {
    console.warn("Push sidekick code to Firestore falhou:", error.message);
  }
}

function removeCodeFromFirestore(code) {
  if (!isFirebaseReady()) return;
  try {
    const db = getFirestore();
    db.collection("sidekickCodes").doc(code).delete();
  } catch (error) {
    console.warn("Remove sidekick code from Firestore falhou:", error.message);
  }
}

async function pullCodeFromFirestore(code) {
  if (!isFirebaseReady()) return null;
  try {
    const db = getFirestore();
    const doc = await db.collection("sidekickCodes").doc(code).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    console.warn("Pull sidekick code from Firestore falhou:", error.message);
    return null;
  }
}
