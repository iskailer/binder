import * as eventService from "../../services/eventService.js";
import { playerView } from "./playerView.js";

export async function render(context) {
  let participants = [];

  if (context.event) {
    participants = await eventService.getEventParticipants(context.event.id);
  }

  return playerView({
    participants,
    activePlayer: context.player,
    event: context.event
  });
}

export function bind() {
  // Read-only view — no actions needed
}
