import { isFirebaseReady, getFirestore, getCurrentUser } from "../services/firebaseService.js";

export async function pushLocalChanges() {
  if (!isFirebaseReady()) {
    return {
      ok: true,
      mode: "local-only",
      message: "Firebase nao disponivel. Dados permanecem no PouchDB local."
    };
  }

  return {
    ok: true,
    mode: "firebase-connected",
    message: "Dados sincronizados via Firestore quando online."
  };
}

export async function pullRemoteChanges() {
  if (!isFirebaseReady()) {
    return {
      ok: true,
      mode: "local-only",
      message: "Nada para puxar: Firebase offline ou nao configurado."
    };
  }

  return {
    ok: true,
    mode: "firebase-connected",
    message: "Firestore persistence mantem dados locais atualizados."
  };
}

export async function resolveConflict(localDoc, remoteDoc) {
  return {
    winner: localDoc,
    discarded: remoteDoc,
    strategy: "local-first"
  };
}
