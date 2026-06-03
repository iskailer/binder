import { createPlayer, getPlayerByFirebaseUid, updatePlayer } from "../../data/playerRepository.js";
import { pickAvatarType } from "../../services/avatarService.js";
import { syncPlayerToFirestore, signInAnonymously, signInWithGoogle, getCurrentUser } from "../../services/firebaseService.js";
import { showToast } from "../../services/notificationService.js";
import { ROUTES, STORAGE_KEYS } from "../../utils/constants.js";
import { setStorageValue } from "../../utils/storage.js";
import { maxLength, requiredText } from "../../utils/validators.js";
import { authView } from "./authView.js";

export async function render(context) {
  return authView({ players: context.players });
}

export function bind(context) {
  // Google Sign-In
  document.getElementById("google-login-btn")?.addEventListener("click", async () => {
    try {
      const user = await signInWithGoogle();
      if (!user) {
        showToast("Login Google cancelado.", "error");
        return;
      }

      // Check if this Google account already has a linked player
      const existingPlayer = await getPlayerByFirebaseUid(user.uid);
      if (existingPlayer) {
        setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, existingPlayer.id);
        showToast(`Bem-vindo de volta, ${existingPlayer.name}!`, "success");
        context.navigate(ROUTES.HOME);
        return;
      }

      // New Google user — create player with their display name
      const displayName = user.displayName || user.email?.split("@")[0] || "Jogador";
      const name = displayName.substring(0, 32);
      const player = await createPlayer({
        name,
        avatarType: pickAvatarType(name),
        firebaseUid: user.uid
      });

      setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, player.id);
      syncPlayerToFirestore(player);

      showToast(`Bem-vindo, ${name}! Conta Google vinculada.`, "success");
      context.navigate(ROUTES.HOME);
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        showToast("Login cancelado.", "error");
      } else {
        showToast(error.message || "Falha no login Google.", "error");
      }
    }
  });

  // Create player without login (anonymous/local only)
  document.getElementById("create-player-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const name = maxLength(requiredText(form.get("name"), "apelido"), 32, "Apelido");

      // Sign in anonymously to get a UID (but warn user data is local)
      const user = await signInAnonymously();
      const firebaseUid = user?.uid || null;

      if (firebaseUid) {
        const existingPlayer = await getPlayerByFirebaseUid(firebaseUid);
        if (existingPlayer) {
          setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, existingPlayer.id);
          showToast(`Bem-vindo de volta, ${existingPlayer.name}!`, "success");
          context.navigate(ROUTES.HOME);
          return;
        }
      }

      const player = await createPlayer({
        name,
        avatarType: pickAvatarType(name),
        firebaseUid
      });

      setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, player.id);
      syncPlayerToFirestore(player);

      showToast("Jogador criado. Recomendamos vincular ao Google depois.", "success");
      context.navigate(ROUTES.HOME);
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  // Select existing player
  document.querySelectorAll("[data-select-player]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, btn.dataset.selectPlayer);

      const user = getCurrentUser();
      if (user) {
        const { getPlayerById } = await import("../../data/playerRepository.js");
        const player = await getPlayerById(btn.dataset.selectPlayer);
        if (player && !player.firebaseUid) {
          await updatePlayer({ ...player, firebaseUid: user.uid });
          syncPlayerToFirestore(player);
        }
      }

      showToast("Jogador ativo trocado.", "success");
      context.navigate(ROUTES.HOME);
    });
  });
}
