import { DOC_TYPES, EVENT_STATUS } from "../utils/constants.js";
import { listEntities, getEntity, saveEntity } from "./db.js";

export async function createEvent(event) {
  return saveEntity(DOC_TYPES.EVENT, event);
}

export async function updateEvent(event) {
  return saveEntity(DOC_TYPES.EVENT, event);
}

export async function getEventById(eventId) {
  return getEntity(DOC_TYPES.EVENT, eventId);
}

export async function listEvents() {
  const events = await listEntities(DOC_TYPES.EVENT);
  return events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function listOpenEvents() {
  const events = await listEvents();
  return events.filter((event) => event.status === EVENT_STATUS.OPEN);
}
