import { APP_CONFIG } from "../config/appConfig.js";
import { EVENT_STATUS } from "../utils/constants.js";
import { createId } from "../utils/ids.js";
import { getEventDeadlineIso, isPastIso, nowIso } from "../utils/time.js";

export function createDefaultEvent(playerId, createdAt = nowIso()) {
  return {
    id: createId("event"),
    name: `Role lendario de ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(createdAt))}`,
    description: "",
    locationLabel: "",
    vibe: "nonsense brasileiro",
    status: EVENT_STATUS.OPEN,
    createdAt,
    endedAt: null,
    participants: playerId ? [playerId] : [],
    rankingSnapshot: [],
    maxDurationHours: APP_CONFIG.eventMaxDurationHours,
    closeReason: null
  };
}

export function getEventDeadline(event) {
  return getEventDeadlineIso(event.createdAt, event.maxDurationHours || APP_CONFIG.eventMaxDurationHours);
}

export function isEventExpired(event, referenceIso = nowIso()) {
  return event?.status === EVENT_STATUS.OPEN && isPastIso(getEventDeadline(event), referenceIso);
}

export function assertEventCanReceiveScore(event, referenceIso = nowIso()) {
  if (!event) {
    throw new Error("Inicie um evento antes de pontuar.");
  }

  if (event.status !== EVENT_STATUS.OPEN) {
    throw new Error("Evento fechado nao aceita novas pontuacoes.");
  }

  if (isEventExpired(event, referenceIso)) {
    throw new Error("Evento passou do limite de 2 dias e foi fechado.");
  }
}

export function closeEvent(event, rankingSnapshot = [], endedAt = nowIso(), closeReason = "manual") {
  return {
    ...event,
    status: EVENT_STATUS.CLOSED,
    endedAt,
    rankingSnapshot,
    closeReason
  };
}

export function addParticipant(event, playerId) {
  const participants = new Set(event.participants || []);
  participants.add(playerId);
  return { ...event, participants: Array.from(participants) };
}
