import { createPlayer } from "../../data/playerRepository.js";
import * as eventService from "../../services/eventService.js";
import { syncPlayerToFirestore } from "../../services/firebaseService.js";
import { pickAvatarType } from "../../services/avatarService.js";
import { showToast, showToastAndRedirect } from "../../services/notificationService.js";
import { STORAGE_KEYS } from "../../utils/constants.js";
import { setStorageValue } from "../../utils/storage.js";
import { maxLength, requiredText } from "../../utils/validators.js";
import { playerView } from "./playerView.js";

export async function render(context) {
  return playerView({
    players: context.players,
    activePlayer: context.player,
    event: context.event
  });
}

export function bind(context) {
  document.getElementById("add-player-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const name = maxLength(requiredText(form.get("name"), "apelido"), 32, "Apelido");
      const player = await createPlayer({ name, avatarType: pickAvatarType(name) });
      if (context.event) await eventService.joinEvent(context.event.id, player.id);
      syncPlayerToFirestore(player);
      showToastAndRedirect("Participante adicionado com sucesso!", "success", context.navigate);
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.querySelectorAll("[data-active-player]").forEach((button) => {
    button.addEventListener("click", () => {
      setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, button.dataset.activePlayer);
      showToast("Jogador ativo atualizado.", "success");
      context.refresh();
    });
  });

  document.querySelectorAll("[data-join-player]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await eventService.joinEvent(context.event.id, button.dataset.joinPlayer);
        showToast("Jogador entrou no evento.", "success");
        context.refresh();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}
