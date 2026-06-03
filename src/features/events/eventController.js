import * as eventService from "../../services/eventService.js";
import { syncEventToFirestore } from "../../services/firebaseService.js";
import { showToast, showToastAndRedirect } from "../../services/notificationService.js";
import { ROUTES, STORAGE_KEYS } from "../../utils/constants.js";
import { setStorageValue } from "../../utils/storage.js";
import { maxLength, requiredText } from "../../utils/validators.js";
import { eventView } from "./eventView.js";

export async function render(context) {
  const participants = context.event ? await eventService.getEventParticipants(context.event.id) : [];
  return eventView({ event: context.event, participants });
}

export function bind(context) {
  document.getElementById("start-event-btn")?.addEventListener("click", async () => {
    try {
      const event = await eventService.startEvent(context.player.id);
      setStorageValue(STORAGE_KEYS.ACTIVE_EVENT_ID, event.id);
      syncEventToFirestore(event);
      showToast("Evento iniciado.", "success");
      context.refresh();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("event-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const updated = await eventService.updateEventDetails(context.event.id, {
        name: maxLength(requiredText(form.get("name"), "nome do evento"), 60, "Nome"),
        description: maxLength(form.get("description"), 180, "Descricao"),
        locationLabel: maxLength(form.get("locationLabel"), 60, "Local"),
        vibe: maxLength(form.get("vibe"), 60, "Vibe")
      });
      syncEventToFirestore(updated);
      showToastAndRedirect("Evento atualizado com sucesso!", "success", context.navigate);
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("end-event-btn")?.addEventListener("click", async () => {
    try {
      const event = await eventService.endEvent(context.event.id);
      setStorageValue(STORAGE_KEYS.ACTIVE_EVENT_ID, event.id);
      syncEventToFirestore(event);
      showToastAndRedirect("Evento encerrado com snapshot do ranking.", "success", context.navigate);
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}
