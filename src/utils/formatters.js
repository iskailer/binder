const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

export function formatDateTime(isoDate) {
  if (!isoDate) return "sem data";
  return dateTimeFormatter.format(new Date(isoDate));
}

export function formatShortDateTime(isoDate) {
  if (!isoDate) return "agora";
  return shortDateFormatter.format(new Date(isoDate));
}

export function formatPoints(points) {
  const value = Number(points || 0);
  return `${value} ${value === 1 ? "ponto" : "pontos"}`;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDistanceMeters(distance) {
  if (distance == null || Number.isNaN(Number(distance))) return "sem GPS";
  if (distance < 1000) return `${Math.round(distance)} m`;
  return `${(distance / 1000).toFixed(1).replace(".", ",")} km`;
}
