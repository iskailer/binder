import { seedFixedCategories, listActiveCategories } from "./data/categoryRepository.js";
import { getEventById } from "./data/eventRepository.js";
import { listPlayers, getPlayerById } from "./data/playerRepository.js";
import * as eventService from "./services/eventService.js";
import { initFirebase } from "./services/firebaseService.js";
import { observeNetworkStatus, registerPwa } from "./services/pwaService.js";
import { showToast } from "./services/notificationService.js";
import { shell } from "./ui/layout/shell.js";
import { loadingState } from "./ui/components/loadingState.js";
import { ROUTES, STORAGE_KEYS, EVENT_STATUS } from "./utils/constants.js";
import { getStorageValue, setStorageValue } from "./utils/storage.js";
import { escapeHtml } from "./utils/formatters.js";

import * as authController from "./features/auth/authController.js";
import * as homeController from "./features/home/homeController.js";
import * as playerController from "./features/players/playerController.js";
import * as eventController from "./features/events/eventController.js";
import * as categoryController from "./features/categories/categoryController.js";
import * as playController from "./features/play/playController.js";
import * as validationController from "./features/validation/validationController.js";
import * as rankingController from "./features/ranking/rankingController.js";
import * as profileController from "./features/profile/profileController.js";
import * as achievementsController from "./features/achievements/achievementsController.js";
import * as adminController from "./features/admin/adminController.js";

const routeMap = {
  [ROUTES.AUTH]: authController,
  [ROUTES.HOME]: homeController,
  [ROUTES.PLAYERS]: playerController,
  [ROUTES.EVENT]: eventController,
  [ROUTES.CATEGORIES]: categoryController,
  [ROUTES.PLAY]: playController,
  [ROUTES.VALIDATION]: validationController,
  [ROUTES.RANKING]: rankingController,
  [ROUTES.PROFILE]: profileController,
  [ROUTES.ACHIEVEMENTS]: achievementsController,
  [ROUTES.ADMIN]: adminController
};

const appElement = document.getElementById("app");
let isOnline = navigator.onLine;
let refreshTimers = [];
let renderLock = Promise.resolve();

init();

async function init() {
  appElement.innerHTML = loadingState();
  await registerPwa();

  await initFirebase();

  observeNetworkStatus(({ isOnline: nextIsOnline }) => {
    isOnline = nextIsOnline;
    render();
  });

  try {
    await seedFixedCategories();
    await eventService.closeExpiredEvents();
  } catch (error) {
    console.error(error);
  }

  window.addEventListener("hashchange", render);
  if (!location.hash) {
    location.hash = ROUTES.HOME;
  } else {
    render();
  }
}

function render() {
  renderLock = renderLock.then(() => renderNow()).catch((error) => {
    console.error(error);
    renderError(error);
  });
  return renderLock;
}

async function renderNow() {
  clearScheduledRefreshes();
  const context = await buildContext();
  const controller = routeMap[context.route] || homeController;
  const content = await controller.render(context);

  appElement.innerHTML = shell({
    content,
    route: context.route,
    player: context.player,
    event: context.event,
    isOnline
  });

  controller.bind?.(context);
  document.getElementById("screen")?.focus({ preventScroll: true });
}

async function buildContext() {
  const players = await listPlayers();
  const activePlayer = await resolveActivePlayer(players);
  const categories = await listActiveCategories();
  const route = resolveRoute(activePlayer);
  const event = activePlayer ? await resolveCurrentEvent(activePlayer.id) : null;

  return {
    route,
    players,
    player: activePlayer,
    event,
    categories,
    isOnline,
    navigate,
    refresh: render,
    scheduleRefresh(delayMs) {
      refreshTimers.push(setTimeout(render, delayMs));
    }
  };
}

async function resolveActivePlayer(players) {
  if (!players.length) return null;

  const activePlayerId = getStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID);
  const activePlayer = activePlayerId ? await getPlayerById(activePlayerId) : null;
  const resolved = activePlayer || players[0];
  setStorageValue(STORAGE_KEYS.ACTIVE_PLAYER_ID, resolved.id);
  return resolved;
}

async function resolveCurrentEvent(playerId) {
  const activeOpenEvent = await eventService.getActiveEvent();

  if (activeOpenEvent) {
    setStorageValue(STORAGE_KEYS.ACTIVE_EVENT_ID, activeOpenEvent.id);
    if (!activeOpenEvent.participants?.includes(playerId)) {
      return eventService.joinEvent(activeOpenEvent.id, playerId);
    }
    return activeOpenEvent;
  }

  const storedEventId = getStorageValue(STORAGE_KEYS.ACTIVE_EVENT_ID);
  if (!storedEventId) return null;
  const storedEvent = await getEventById(storedEventId);
  return storedEvent?.status === EVENT_STATUS.CLOSED ? storedEvent : null;
}

function resolveRoute(player) {
  const route = location.hash.split("?")[0];

  if (!player) {
    return ROUTES.AUTH;
  }

  if (route === ROUTES.AUTH) {
    return ROUTES.HOME;
  }

  return routeMap[route] ? route : ROUTES.HOME;
}

function navigate(route) {
  if (location.hash === route) {
    render();
    return;
  }
  location.hash = route;
}

function clearScheduledRefreshes() {
  refreshTimers.forEach((timer) => clearTimeout(timer));
  refreshTimers = [];
}

function renderError(error) {
  appElement.innerHTML = `
    <main class="screen error-screen">
      <section class="empty-state">
        <div class="empty-state__sigil">!</div>
        <h1>Erro no grimorio local</h1>
        <p>${escapeHtml(error.message || "Algo saiu torto.")}</p>
        <button class="btn btn--primary" type="button" onclick="location.reload()">Recarregar</button>
      </section>
    </main>
  `;
  showToast(error.message || "Erro inesperado.", "error");
}
