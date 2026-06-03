// Firebase config is loaded at runtime from firebase-config.js (not committed to git).
// See firebase-config.example.js for the expected format.
const runtimeFirebaseConfig = globalThis.__FIREBASE_CONFIG__ || null;

export const APP_CONFIG = Object.freeze({
  appName: "Roleta Brusca",
  dbName: "roleta_brusca_v1",
  eventMaxDurationHours: 48,
  eventCalendarWindowDays: 2,
  codeTtlSeconds: 60,
  proximityMeters: 50,
  sidekickRate: 0.22,
  sidekickMinPoints: 3,
  sidekickMaxPoints: 8,
  levelXpStep: 100,
  pouchCdnUrl: "https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js",
  adminEmails: globalThis.__ADMIN_EMAILS__ || [],
  firebaseConfig: runtimeFirebaseConfig || {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  }
});
