import * as eventService from "../../services/eventService.js";
import { listGeoEventsFromFirestore, isFirebaseReady } from "../../services/firebaseService.js";
import { getCurrentPosition, getDistanceMeters } from "../../services/geoService.js";
import { showToast } from "../../services/notificationService.js";
import { ROUTES, STORAGE_KEYS } from "../../utils/constants.js";
import { setStorageValue } from "../../utils/storage.js";
import { APP_CONFIG } from "../../config/appConfig.js";
import { escapeHtml } from "../../utils/formatters.js";
import { homeView } from "./homeView.js";

export async function render(context) {
  const ranking = context.event ? await eventService.getEventRanking(context.event.id) : [];
  return homeView({
    player: context.player,
    event: context.event,
    ranking,
    isOnline: context.isOnline
  });
}

export function bind(context) {
  // If no open event, automatically search for nearby geo events
  if (!context.event || context.event.status !== "open") {
    autoSearchNearby(context);
  }

  document.querySelectorAll("#start-event-btn, #start-event-empty-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const event = await eventService.startEvent(context.player.id);
        setStorageValue(STORAGE_KEYS.ACTIVE_EVENT_ID, event.id);
        showToast("Evento iniciado. O destino abriu uma comanda.", "success");
        context.navigate(ROUTES.EVENT);
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => context.navigate(button.dataset.route));
  });
}

async function autoSearchNearby(context) {
  const statusDiv = document.getElementById("nearby-search-status");
  const createArea = document.getElementById("create-event-area");
  if (!statusDiv || !createArea) return;

  // Set a 10s timeout — if search doesn't complete, show create button
  const fallbackTimer = setTimeout(() => {
    showCreateEvent(statusDiv, createArea, "Busca demorou demais. Crie seu proprio evento.");
  }, 10000);

  try {
    const position = await getCurrentPosition();
    let geoEvents = [];

    if (isFirebaseReady()) {
      geoEvents = await listGeoEventsFromFirestore();
    }

    const nearby = geoEvents.find((ev) => {
      if (!ev.location) return false;
      const dist = getDistanceMeters(position, ev.location);
      return dist !== null && dist <= (ev.radius || APP_CONFIG.proximityMeters);
    });

    clearTimeout(fallbackTimer);

    if (nearby) {
      statusDiv.innerHTML = `
        <article class="metric-card metric-card--hot" style="margin-top:0.75rem">
          <span>Evento encontrado!</span>
          <strong>${escapeHtml(nearby.name)}</strong>
          <small>${escapeHtml(nearby.description || "Sem descricao")}</small>
        </article>
      `;
      // Update the section heading
      const section = document.getElementById("event-search-section");
      if (section) {
        const h2 = section.querySelector("h2");
        if (h2) h2.textContent = "Evento proximo encontrado!";
      }
      showToast(`Evento "${nearby.name}" encontrado perto de voce!`, "success");
    } else {
      showCreateEvent(statusDiv, createArea, "Nenhum evento encontrado em ate 50m.");
    }
  } catch (error) {
    clearTimeout(fallbackTimer);
    // GPS error or firebase error — show create button immediately
    showCreateEvent(statusDiv, createArea, error.message || "Nao foi possivel buscar eventos.");
  }
}

function showCreateEvent(statusDiv, createArea, message) {
  statusDiv.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
  createArea.style.display = "block";
  const section = document.getElementById("event-search-section");
  if (section) {
    const h2 = section.querySelector("h2");
    if (h2) h2.textContent = "Criar evento";
  }
}
