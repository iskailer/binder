import * as eventService from "../../services/eventService.js";
import { listGeoEventsFromFirestore, isFirebaseReady, syncEventToFirestore } from "../../services/firebaseService.js";
import { getCurrentPosition, getDistanceMeters } from "../../services/geoService.js";
import { showToast } from "../../services/notificationService.js";
import { ROUTES, STORAGE_KEYS, EVENT_STATUS } from "../../utils/constants.js";
import { setStorageValue } from "../../utils/storage.js";
import { APP_CONFIG } from "../../config/appConfig.js";
import { escapeHtml } from "../../utils/formatters.js";
import { button } from "../../ui/components/button.js";
import { homeView } from "./homeView.js";

let foundNearbyEvent = null;

export async function render(context) {
  const ranking = context.event ? await eventService.getEventRanking(context.event.id) : [];
  foundNearbyEvent = null;
  return homeView({
    player: context.player,
    event: context.event,
    ranking,
    isOnline: context.isOnline
  });
}

export function bind(context) {
  // If no open event, automatically search for nearby geo events
  if (!context.event || context.event.status !== EVENT_STATUS.OPEN) {
    autoSearchNearby(context);
  }

  document.querySelectorAll("#start-event-btn, #start-event-empty-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
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

  document.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => context.navigate(btn.dataset.route));
  });
}

async function autoSearchNearby(context) {
  const statusDiv = document.getElementById("nearby-search-status");
  const createArea = document.getElementById("create-event-area");
  const foundArea = document.getElementById("nearby-event-found");
  if (!statusDiv || !createArea) return;

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
      foundNearbyEvent = nearby;
      statusDiv.innerHTML = "";

      const section = document.getElementById("event-search-section");
      if (section) {
        const h2 = section.querySelector("h2");
        if (h2) h2.textContent = "Evento proximo encontrado!";
      }

      if (foundArea) {
        foundArea.style.display = "block";
        foundArea.innerHTML = `
          <article class="metric-card metric-card--hot">
            <span>Evento na area</span>
            <strong>${escapeHtml(nearby.name)}</strong>
            <small>${escapeHtml(nearby.description || "Sem descricao")}</small>
          </article>
          ${button({ label: "Entrar neste evento", variant: "primary", size: "large", id: "join-nearby-event-btn" })}
        `;

        // Bind join button after injecting
        document.getElementById("join-nearby-event-btn")?.addEventListener("click", async () => {
          try {
            await joinNearbyGeoEvent(nearby, context);
          } catch (error) {
            showToast(error.message, "error");
          }
        });
      }

      showToast(`Evento "${nearby.name}" encontrado perto de voce!`, "success");
    } else {
      showCreateEvent(statusDiv, createArea, "Nenhum evento encontrado em ate 50m.");
    }
  } catch (error) {
    clearTimeout(fallbackTimer);
    showCreateEvent(statusDiv, createArea, error.message || "Nao foi possivel buscar eventos.");
  }
}

async function joinNearbyGeoEvent(geoEvent, context) {
  // Create a local event mirroring the geo event, or start fresh and join
  const event = await eventService.startEvent(context.player.id);

  // Update local event with the geo event's info
  await eventService.updateEventDetails(event.id, {
    name: geoEvent.name,
    description: geoEvent.description || "",
    locationLabel: `Lat ${geoEvent.location?.latitude?.toFixed(4)}, Lng ${geoEvent.location?.longitude?.toFixed(4)}`,
    vibe: "evento geografico"
  });

  setStorageValue(STORAGE_KEYS.ACTIVE_EVENT_ID, event.id);
  syncEventToFirestore({ ...event, geoEventRef: geoEvent.id });
  showToast(`Voce entrou no evento "${geoEvent.name}"!`, "success");
  context.navigate(ROUTES.HOME);
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
