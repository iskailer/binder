import * as validationRepository from "../../data/validationRepository.js";
import * as codeService from "../../services/codeService.js";
import { showToast, showToastAndRedirect } from "../../services/notificationService.js";
import { ROUTES, STORAGE_KEYS } from "../../utils/constants.js";
import { getStorageValue, removeStorageValue } from "../../utils/storage.js";
import { validationView } from "./validationView.js";

export async function render(context) {
  if (context.event) {
    await codeService.expireStaleCodes(context.event.id);
  }

  const [participants, validations] = context.event
    ? await Promise.all([
        import("../../services/eventService.js").then((module) => module.getEventParticipants(context.event.id)),
        validationRepository.listValidationCodesByEvent(context.event.id)
      ])
    : [[], []];

  return validationView({
    event: context.event,
    activePlayer: context.player,
    participants,
    categories: context.categories,
    validations,
    selectedCategoryId: getStorageValue(STORAGE_KEYS.SELECTED_CATEGORY_ID)
  });
}

export function bind(context) {
  document.getElementById("request-validation-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await codeService.createValidationRequest({
        eventId: context.event.id,
        categoryId: form.get("categoryId"),
        targetPlayerId: context.player.id
      });
      removeStorageValue(STORAGE_KEYS.SELECTED_CATEGORY_ID);
      showToast("Pedido criado com GPS. Agora outro jogador gera o codigo.", "success");
      context.refresh();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.querySelectorAll("[data-generate-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      const requestId = button.dataset.generateCode;
      const select = document.querySelector(`[data-validator-select="${CSS.escape(requestId)}"]`);

      try {
        const code = await codeService.generateValidationCode({
          requestId,
          validatorPlayerId: select?.value
        });
        showToast(`Codigo ${code.code} ativo por 15 segundos.`, "success");
        context.refresh();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.getElementById("consume-code-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const result = await codeService.validateCodeAndScore({
        rawCode: form.get("code"),
        targetPlayerId: context.player.id
      });
      showToastAndRedirect(
        `+${result.actionScore.points} XP para ${result.category.name}; sidekick tambem pontuou.`,
        "success",
        context.navigate
      );
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  if (document.querySelector(".code-card")) {
    context.scheduleRefresh(1000);
  }
}
