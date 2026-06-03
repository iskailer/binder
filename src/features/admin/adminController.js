import { getCurrentPosition } from "../../services/geoService.js";
import {
  createGeoEventInFirestore,
  listGeoEventsFromFirestore,
  isFirebaseReady,
  getCurrentUser,
  signInWithEmail,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore
} from "../../services/firebaseService.js";
import * as eventService from "../../services/eventService.js";
import * as categoryRepository from "../../data/categoryRepository.js";
import { showToast, showToastAndRedirect } from "../../services/notificationService.js";
import { nowIso } from "../../utils/time.js";
import { createId, slugify } from "../../utils/ids.js";
import { requiredText, maxLength } from "../../utils/validators.js";
import { APP_CONFIG } from "../../config/appConfig.js";
import { adminView } from "./adminView.js";

function isAdmin() {
  const user = getCurrentUser();
  if (!user || !user.email) return false;
  const admins = APP_CONFIG.adminEmails || [];
  return admins.includes(user.email);
}

export async function render(context) {
  const user = getCurrentUser();

  if (!user || !user.email || !isAdmin()) {
    return adminView({ authenticated: false });
  }

  let geoEvents = [];
  let ranking = [];

  if (isFirebaseReady()) {
    geoEvents = await listGeoEventsFromFirestore();
  }

  if (context.event) {
    ranking = await eventService.getEventRanking(context.event.id);
  }

  const categories = await categoryRepository.listCategories();

  return adminView({
    authenticated: true,
    geoEvents,
    ranking,
    currentEventId: context.event?.id || null,
    categories
  });
}

export function bind(context) {
  // Admin login
  document.getElementById("admin-login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email")?.trim();
    const password = form.get("password");

    try {
      await signInWithEmail(email, password);
      if (!isAdmin()) {
        showToast("Acesso negado. Voce nao e administrador.", "error");
        return;
      }
      showToast("Login admin realizado.", "success");
      context.refresh();
    } catch (error) {
      showToast("Credenciais invalidas ou Firebase indisponivel.", "error");
    }
  });

  // Create category
  document.getElementById("create-category-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    try {
      const name = maxLength(requiredText(form.get("categoryName"), "nome"), 60, "Nome");
      const description = maxLength(form.get("categoryDescription") || "", 120, "Descricao");
      const points = Number(form.get("categoryPoints")) || 10;
      const id = slugify(name) || createId("cat");

      const category = await categoryRepository.createCategory({ id, name, description, points });
      saveCategoryToFirestore(category);

      showToast(`Categoria "${name}" criada!`, "success");
      context.refresh();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  // Toggle category active/inactive
  document.querySelectorAll("[data-toggle-category]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const updated = await categoryRepository.toggleCategoryActive(btn.dataset.toggleCategory);
        if (updated) {
          saveCategoryToFirestore(updated);
          showToast(`Categoria ${updated.active ? "ativada" : "desativada"}.`, "success");
        }
        context.refresh();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  // Delete category
  document.querySelectorAll("[data-delete-category]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const id = btn.dataset.deleteCategory;
        await categoryRepository.deleteCategory(id);
        deleteCategoryFromFirestore(id);
        showToast("Categoria excluida.", "success");
        context.refresh();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  // Create geo event
  document.getElementById("create-geo-event-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    try {
      const name = maxLength(requiredText(form.get("eventName"), "nome do evento"), 60, "Nome");
      const description = maxLength(form.get("eventDescription") || "", 180, "Descricao");
      const radius = Number(form.get("radius")) || 50;

      const position = await getCurrentPosition();

      const eventData = {
        id: createId("geoevent"),
        name,
        description,
        location: {
          latitude: position.latitude,
          longitude: position.longitude
        },
        radius,
        status: "open",
        geoEnabled: true,
        createdAt: nowIso(),
        createdBy: context.player.id
      };

      if (isFirebaseReady()) {
        await createGeoEventInFirestore(eventData);
      }

      showToastAndRedirect("Evento geografico criado com sucesso!", "success", context.navigate);
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}
