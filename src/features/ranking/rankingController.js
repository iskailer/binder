import * as eventService from "../../services/eventService.js";
import { rankingView } from "./rankingView.js";

export async function render(context) {
  const ranking = context.event ? await eventService.getEventRanking(context.event.id) : [];
  return rankingView({
    event: context.event,
    ranking
  });
}

export function bind() {}
