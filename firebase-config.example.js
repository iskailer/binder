// Copie este arquivo para firebase-config.js e preencha com suas credenciais.
// firebase-config.js NAO deve ser commitado ao repositorio (esta no .gitignore).
//
// Para GitHub Pages: use GitHub Actions para injetar as keys como secrets
// durante o deploy (veja a secao "Protegendo Keys" no README).

globalThis.__FIREBASE_CONFIG__ = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Lista de emails que tem acesso ao painel Admin
globalThis.__ADMIN_EMAILS__ = ["admin@exemplo.com"];
