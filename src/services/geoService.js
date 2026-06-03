import { APP_CONFIG } from "../config/appConfig.js";

export async function getCurrentPosition() {
  if (!("geolocation" in navigator)) {
    throw new Error("Geolocalizacao indisponivel neste navegador.");
  }

  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  if (!globalThis.isSecureContext && !isLocalhost) {
    throw new Error("GPS bloqueado: abra via HTTPS ou localhost.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString()
        });
      },
      (error) => {
        const messages = {
          1: "Permissao de GPS negada. Nao da para gerar codigo sem proximidade.",
          2: "GPS indisponivel agora. Tente de novo com sinal melhor.",
          3: "GPS demorou demais. Tente novamente."
        };
        reject(new Error(messages[error.code] || "Falha ao obter geolocalizacao."));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  });
}

export function getDistanceMeters(a, b) {
  if (!a || !b) return null;

  const earthRadius = 6371000;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadius * angularDistance;
}

export function isWithinConfiguredDistance(a, b) {
  const distance = getDistanceMeters(a, b);
  return distance != null && distance <= APP_CONFIG.proximityMeters;
}

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}
