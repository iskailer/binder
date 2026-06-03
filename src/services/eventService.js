import * as eventRepository from "../data/eventRepository.js";
import * as playerRepository from "../data/playerRepository.js";
import * as scoreRepository from "../data/scoreRepository.js";
import { buildRanking } from "../domain/rankingRules.js";
import { calculateEndOfNightTitles } from "../domain/endOfNightTitles.js";
import { addParticipant, closeEvent, createDefaultEvent, isEventExpired } from "../domain/eventRules.js";
import { EVENT_STATUS } from "../utils/constants.js";
import { nowIso } from "../utils/time.js";
import { isFirebaseReady, getFirestore, syncPlayerToFirestore, syncEventToFirestore, listPlayersFromFirestore, listScoresFromFirestore } from "./firebaseService.js";

export async function startEvent(playerId) {
  await closeExpiredEvents();
  const active = await getActiveEvent();
  if (active) {
    return joinEvent(active.id, playerId);
  }

  const event = createDefaultEvent(playerId);
  const created = await eventRepository.createEvent(event);

  // Sync new event and player to Firestore
  const player = await playerRepository.getPlayerById(playerId);
  if (player && isFirebaseReady()) {
    syncPlayerToFirestore({ ...player, eventIds: [created.id] });
    syncEventToFirestore(created);
  }

  return created;
}

export async function getActiveEvent() {
  await closeExpiredEvents();
  const events = await eventRepository.listOpenEvents();
  if (events[0]) return events[0];

  // If no local event, check Firestore for a shared event
  if (isFirebaseReady()) {
    try {
      const db = getFirestore();
      if (!db) return null;
      const snapshot = await db.collection("events")
        .where("status", "==", "open")
        .limit(5)
        .get();

      if (!snapshot.empty) {
        // Find the most recent open event
        const docs = snapshot.docs.map((d) => d.data());
        const sorted = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const remoteEvent = sorted[0];
        // Save to local PouchDB
        await eventRepository.createEvent(remoteEvent).catch(() =>
          eventRepository.updateEvent(remoteEvent).catch(() => {})
        );
        return remoteEvent;
      }
    } catch (error) {
      console.warn("Busca evento remoto falhou:", error.message);
    }
  }

  return null;
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
  const updatedEvent = await eventRepository.updateEvent(addParticipant(event, playerId));

  // Sync player and event to Firestore for cross-device visibility
  const player = await playerRepository.getPlayerById(playerId);
  if (player && isFirebaseReady()) {
    syncPlayerToFirestore({ ...player, eventIds: [eventId] });
    syncEventToFirestore(updatedEvent);
  }

  return updatedEvent;
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
  const [event, localPlayers, localScores] = await Promise.all([
    eventRepository.getEventById(eventId),
    playerRepository.listPlayers(),
    scoreRepository.listScoreEntriesByEvent(eventId)
  ]);

  // Merge remote data for cross-device visibility
  let players = localPlayers;
  let scores = localScores;

  if (isFirebaseReady()) {
    try {
      const [remotePlayers, remoteScores] = await Promise.all([
        listPlayersFromFirestore(eventId),
        listScoresFromFirestore(eventId)
      ]);

      // Merge remote players not present locally
      const localPlayerIds = new Set(localPlayers.map((p) => p.id));
      for (const rp of remotePlayers) {
        if (rp.id && !localPlayerIds.has(rp.id)) {
          players.push(rp);
          // Save to local PouchDB for offline access
          playerRepository.updatePlayer(rp).catch(() => {});
        }
      }

      // Merge remote scores not present locally
      const localScoreIds = new Set(localScores.map((s) => s.id));
      for (const rs of remoteScores) {
        if (rs.id && !localScoreIds.has(rs.id)) {
          scores.push(rs);
          // Save to local PouchDB for offline access
          scoreRepository.addScoreEntry(rs).catch(() => {});
        }
      }
    } catch (error) {
      console.warn("Merge remote data falhou:", error.message);
    }
  }

  return buildRanking(scores, players, event?.participants || []);
}

export async function getEventParticipants(eventId) {
  const [event, localPlayers] = await Promise.all([
    eventRepository.getEventById(eventId),
    playerRepository.listPlayers()
  ]);
  const participantIds = new Set(event?.participants || []);

  let players = localPlayers;

  // Merge remote players for cross-device visibility
  if (isFirebaseReady()) {
    try {
      const remotePlayers = await listPlayersFromFirestore(eventId);
      const localPlayerIds = new Set(localPlayers.map((p) => p.id));
      for (const rp of remotePlayers) {
        if (rp.id && !localPlayerIds.has(rp.id)) {
          players.push(rp);
          participantIds.add(rp.id);
          playerRepository.updatePlayer(rp).catch(() => {});
        }
      }
    } catch (error) {
      console.warn("Merge remote participants falhou:", error.message);
    }
  }

  return players.filter((player) => participantIds.has(player.id));
}

export async function getEventEndOfNightTitles(eventId, participantIds = []) {
  const [players, scores] = await Promise.all([
    playerRepository.listPlayers(),
    scoreRepository.listScoreEntriesByEvent(eventId)
  ]);
  return calculateEndOfNightTitles(scores, players, participantIds);
}
