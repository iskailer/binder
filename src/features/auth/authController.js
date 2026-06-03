import { createPlayer } from "../../data/playerRepository.js";
import { pickAvatarType } from "../../services/avatarService.js";
import { syncPlayerToFirestore, signInAnonymously } from "../../services/firebaseService.js";
import { showToast } from "../../services/notificationService.js";
import { ROUTES, STORAGE_KEYS } from "../../utils/constants.js";
import { setStorageValue } from "../../utils/storage.js";
import { maxLength, requiredText } from "../../utils/validators.js";
import { authView } from "./authView.js";

export async function render(context) {
  return authView({ players: context.players });
}

export function bind(context) {
  document.getElementById("create-player-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const name = maxLength(requiredText(form.get("name"), "apelido"), 32, "Apelido");
      const player = await createPlayer({
        name,
        avatarType: pickAvatarType(name)
      });
      setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, player.id);

      await signInAnonymously();
      syncPlayerToFirestore(player);

      showToast("Jogador criado. A ficha caiu de pe.", "success");
      context.navigate(ROUTES.HOME);
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.querySelectorAll("[data-select-player]").forEach((button) => {
    button.addEventListener("click", () => {
      setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, button.dataset.selectPlayer);
      showToast("Jogador ativo trocado.", "success");
      context.navigate(ROUTES.HOME);
    });
  });
}
