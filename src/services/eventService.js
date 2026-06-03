import * as eventRepository from "../data/eventRepository.js";
import * as playerRepository from "../data/playerRepository.js";
import * as scoreRepository from "../data/scoreRepository.js";
import { buildRanking } from "../domain/rankingRules.js";
import { calculateEndOfNightTitles } from "../domain/endOfNightTitles.js";
import { addParticipant, closeEvent, createDefaultEvent, isEventExpired } from "../domain/eventRules.js";
import { EVENT_STATUS } from "../utils/constants.js";
import { nowIso } from "../utils/time.js";

export async function startEvent(playerId) {
  await closeExpiredEvents();
  const active = await getActiveEvent();
  if (active) {
    return joinEvent(active.id, playerId);
  }

  const event = createDefaultEvent(playerId);
  return eventRepository.createEvent(event);
}

export async function getActiveEvent() {
  await closeExpiredEvents();
  const events = await eventRepository.listOpenEvents();
  return events[0] || null;
}

export async function getEventById(eventId) {
  return eventRepository.getEventById(eventId);
}

export async function listEvents() {
  await closeExpiredEvents();
  return eventRepository.listEvents();
}

export async function updateEventDetails(eventId, changes) {
  const event = await eventRepository.getEventById(eventId);
  if (!event || event.status !== EVENT_STATUS.OPEN) {
    throw new Error("Evento fechado nao pode ser editado.");
  }

  return eventRepository.updateEvent({
    ...event,
    name: changes.name ?? event.name,
    description: changes.description ?? event.description,
    locationLabel: changes.locationLabel ?? event.locationLabel,
    vibe: changes.vibe ?? event.vibe
  });
}

export async function joinEvent(eventId, playerId) {
  const event = await eventRepository.getEventById(eventId);
  if (!event) throw new Error("Evento nao encontrado.");
  return eventRepository.updateEvent(addParticipant(event, playerId));
}

export async function endEvent(eventId, closeReason = "manual") {
  const event = await eventRepository.getEventById(eventId);
  if (!event) throw new Error("Evento nao encontrado.");
  const [rankingSnapshot, endOfNightTitles] = await Promise.all([
    getEventRanking(event.id),
    getEventEndOfNightTitles(event.id, event.participants || [])
  ]);
  const closedEvent = closeEvent(event, rankingSnapshot, nowIso(), closeReason);
  closedEvent.endOfNightTitles = endOfNightTitles;
  return eventRepository.updateEvent(closedEvent);
}

export async function closeExpiredEvents() {
  const events = await eventRepository.listOpenEvents();
  const updated = [];

  for (const event of events) {
    if (isEventExpired(event)) {
      const [rankingSnapshot, endOfNightTitles] = await Promise.all([
        getEventRanking(event.id),
        getEventEndOfNightTitles(event.id, event.participants || [])
      ]);
      const closedEvent = closeEvent(event, rankingSnapshot, nowIso(), "auto-expired");
      closedEvent.endOfNightTitles = endOfNightTitles;
      updated.push(await eventRepository.updateEvent(closedEvent));
    }
  }

  return updated;
}

export async function getEventRanking(eventId) {
  const [event, players, scores] = await Promise.all([
    eventRepository.getEventById(eventId),
    playerRepository.listPlayers(),
    scoreRepository.listScoreEntriesByEvent(eventId)
  ]);
  return buildRanking(scores, players, event?.participants || []);
}

export async function getEventParticipants(eventId) {
  const [event, players] = await Promise.all([
    eventRepository.getEventById(eventId),
    playerRepository.listPlayers()
  ]);
  const participantIds = new Set(event?.participants || []);
  return players.filter((player) => participantIds.has(player.id));
}

export async function getEventEndOfNightTitles(eventId, participantIds = []) {
  const [players, scores] = await Promise.all([
    playerRepository.listPlayers(),
    scoreRepository.listScoreEntriesByEvent(eventId)
  ]);
  return calculateEndOfNightTitles(scores, players, participantIds);
}
