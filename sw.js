const CACHE_NAME = "roleta-brusca-static-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./firebase-config.js",
  "./manifest.webmanifest",
  "./src/styles.css",
  "./src/app.js",
  "./src/config/appConfig.js",
  "./src/data/db.js",
  "./src/data/playerRepository.js",
  "./src/data/eventRepository.js",
  "./src/data/categoryRepository.js",
  "./src/data/validationRepository.js",
  "./src/data/scoreRepository.js",
  "./src/data/achievementRepository.js",
  "./src/data/syncAdapter.js",
  "./src/domain/scoreRules.js",
  "./src/domain/validationRules.js",
  "./src/domain/rankingRules.js",
  "./src/domain/achievementRules.js",
  "./src/domain/levelRules.js",
  "./src/domain/eventRules.js",
  "./src/services/geoService.js",
  "./src/services/codeService.js",
  "./src/services/pwaService.js",
  "./src/services/eventService.js",
  "./src/services/avatarService.js",
  "./src/services/notificationService.js",
  "./src/services/firebaseService.js",
  "./src/services/sidekickService.js",
  "./src/features/auth/authView.js",
  "./src/features/auth/authController.js",
  "./src/features/home/homeView.js",
  "./src/features/home/homeController.js",
  "./src/features/players/playerView.js",
  "./src/features/players/playerController.js",
  "./src/features/events/eventView.js",
  "./src/features/events/eventController.js",
  "./src/features/categories/categoryView.js",
  "./src/features/categories/categoryController.js",
  "./src/features/play/playView.js",
  "./src/features/play/playController.js",
  "./src/features/validation/validationView.js",
  "./src/features/validation/validationController.js",
  "./src/features/ranking/rankingView.js",
  "./src/features/ranking/rankingController.js",
  "./src/features/profile/profileView.js",
  "./src/features/profile/profileController.js",
  "./src/features/achievements/achievementsView.js",
  "./src/features/achievements/achievementsController.js",
  "./src/features/admin/adminView.js",
  "./src/features/admin/adminController.js",
  "./src/ui/components/button.js",
  "./src/ui/components/card.js",
  "./src/ui/components/modal.js",
  "./src/ui/components/badge.js",
  "./src/ui/components/toast.js",
  "./src/ui/components/emptyState.js",
  "./src/ui/components/loadingState.js",
  "./src/ui/layout/header.js",
  "./src/ui/layout/bottomNav.js",
  "./src/ui/layout/shell.js",
  "./src/utils/constants.js",
  "./src/utils/formatters.js",
  "./src/utils/ids.js",
  "./src/utils/storage.js",
  "./src/utils/time.js",
  "./src/utils/validators.js",
  "./src/utils/eventBus.js",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/images/arena.svg",
  "./assets/avatars/bardo-cuscuz.svg",
  "./assets/avatars/maga-lambe.svg",
  "./assets/avatars/tanque-guarana.svg",
  "./assets/avatars/ninja-coxinha.svg",
  "https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        CORE_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn("Cache skip", asset, error);
          }
        })
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      await Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.url.includes("firebaseio.com") || request.url.includes("googleapis.com")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put("./index.html", response.clone());
    return response;
  } catch {
    return (await cache.match("./index.html")) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque" || response.type === "cors")) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}
