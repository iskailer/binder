export function nowIso() {
  return new Date().toISOString();
}

export function addSecondsIso(isoDate, seconds) {
  return new Date(new Date(isoDate).getTime() + seconds * 1000).toISOString();
}

export function addHoursIso(isoDate, hours) {
  return new Date(new Date(isoDate).getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function endOfNextLocalDayIso(isoDate) {
  const date = new Date(isoDate);
  const deadline = new Date(date);
  deadline.setDate(date.getDate() + 1);
  deadline.setHours(23, 59, 59, 999);
  return deadline.toISOString();
}

export function getEventDeadlineIso(createdAt, maxDurationHours) {
  const byHours = addHoursIso(createdAt, maxDurationHours);
  const byCalendarWindow = endOfNextLocalDayIso(createdAt);
  return new Date(byHours) < new Date(byCalendarWindow) ? byHours : byCalendarWindow;
}

export function isPastIso(isoDate, referenceIso = nowIso()) {
  return new Date(isoDate).getTime() <= new Date(referenceIso).getTime();
}

export function secondsUntil(isoDate, referenceIso = nowIso()) {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - new Date(referenceIso).getTime()) / 1000));
}

export function isSameLocalDay(aIso, bIso) {
  const a = new Date(aIso);
  const b = new Date(bIso);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
