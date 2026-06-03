import { APP_CONFIG } from "../config/appConfig.js";
import { STORAGE_KEYS } from "../utils/constants.js";
import { getStorageValue, setStorageValue, removeStorageValue } from "../utils/storage.js";

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let initialized = false;

export async function initFirebase() {
  if (initialized) return;

  try {
    const firebase = globalThis.firebase;
    if (!firebase) {
      console.warn("Firebase SDK nao carregado. Operando somente offline.");
      return;
    }

    const config = APP_CONFIG.firebaseConfig;
    if (!config || !config.apiKey || config.apiKey === "" || config.apiKey === "YOUR_API_KEY") {
      console.warn("Firebase config nao definido. Operando somente offline.");
      return;
    }

    firebaseApp = firebase.initializeApp(config);
    firestoreDb = firebase.firestore();
    firebaseAuth = firebase.auth();

    firestoreDb.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      console.warn("Firestore persistence falhou:", err.code);
    });

    firebaseAuth.onAuthStateChanged((user) => {
      if (user) {
        setStorageValue(STORAGE_KEYS.FIREBASE_UID, user.uid);
      } else {
        removeStorageValue(STORAGE_KEYS.FIREBASE_UID);
      }
    });

    initialized = true;
  } catch (error) {
    console.warn("Firebase init falhou. App continua offline-first:", error.message);
  }
}

export function getFirestore() {
  return firestoreDb;
}

export function getAuth() {
  return firebaseAuth;
}

export function isFirebaseReady() {
  return initialized && firestoreDb != null;
}

export async function signInAnonymously() {
  if (!firebaseAuth) return null;
  try {
    const credential = await firebaseAuth.signInAnonymously();
    return credential.user;
  } catch (error) {
    console.warn("Login anonimo falhou:", error.message);
    return null;
  }
}

export async function signInWithEmail(email, password) {
  if (!firebaseAuth) throw new Error("Firebase nao disponivel. Configure firebase-config.js.");
  const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
  return credential.user;
}

export async function signUpWithEmail(email, password) {
  if (!firebaseAuth) throw new Error("Firebase nao disponivel. Configure firebase-config.js.");
  const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
  return credential.user;
}

export async function signOut() {
  if (!firebaseAuth) return;
  await firebaseAuth.signOut();
  removeStorageValue(STORAGE_KEYS.FIREBASE_UID);
}

export function getCurrentUser() {
  return firebaseAuth?.currentUser || null;
}

export async function syncPlayerToFirestore(player) {
  if (!isFirebaseReady()) return;
  const user = getCurrentUser();
  if (!user) return;

  try {
    await firestoreDb.collection("players").doc(user.uid).set({
      ...player,
      firebaseUid: user.uid,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn("Sync player para Firestore falhou:", error.message);
  }
}

export async function syncScoreToFirestore(scoreEntry) {
  if (!isFirebaseReady()) return;
  const user = getCurrentUser();
  if (!user) return;

  try {
    await firestoreDb.collection("scores").doc(scoreEntry.id).set({
      ...scoreEntry,
      syncedBy: user.uid
    });
  } catch (error) {
    console.warn("Sync score para Firestore falhou:", error.message);
  }
}

export async function syncEventToFirestore(event) {
  if (!isFirebaseReady()) return;
  const user = getCurrentUser();
  if (!user) return;

  try {
    await firestoreDb.collection("events").doc(event.id).set({
      ...event,
      createdBy: event.createdBy || user.uid
    }, { merge: true });
  } catch (error) {
    console.warn("Sync event para Firestore falhou:", error.message);
  }
}

export async function getEventRankingFromFirestore(eventId) {
  if (!isFirebaseReady()) return null;
  try {
    const snapshot = await firestoreDb
      .collection("scores")
      .where("eventId", "==", eventId)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.warn("Leitura ranking Firestore falhou:", error.message);
    return null;
  }
}

export async function listGeoEventsFromFirestore() {
  if (!isFirebaseReady()) return [];
  try {
    const snapshot = await firestoreDb
      .collection("events")
      .where("status", "==", "open")
      .where("geoEnabled", "==", true)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.warn("Leitura geo events Firestore falhou:", error.message);
    return [];
  }
}

export async function createGeoEventInFirestore(eventData) {
  if (!isFirebaseReady()) throw new Error("Firebase nao disponivel para criar evento geo.");
  const user = getCurrentUser();
  if (!user) throw new Error("Faca login antes de criar evento geo.");

  const data = { ...eventData, createdBy: user.uid };
  const docRef = await firestoreDb.collection("events").add(data);
  return { ...data, id: docRef.id };
}
