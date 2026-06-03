import { button } from "../../ui/components/button.js";
import { emptyState } from "../../ui/components/emptyState.js";
import { getEventDeadline } from "../../domain/eventRules.js";
import { EVENT_STATUS, ROUTES } from "../../utils/constants.js";
import { escapeHtml, formatDateTime } from "../../utils/formatters.js";

export function eventView({ event, participants = [] }) {
  if (!event) {
    return emptyState({
      title: "A noite ainda nao tem campanha",
      message: "Inicie um evento e a mesa ja nasce com horario, ranking e limite de 2 dias.",
      action: button({ label: "Iniciar Evento", variant: "primary", size: "large", id: "start-event-btn" })
    });
  }

  const isOpen = event.status === EVENT_STATUS.OPEN;

  return `
    <section class="screen-heading">
      <p class="eyebrow">evento atual</p>
      <h1>${escapeHtml(event.name)}</h1>
    </section>

    <section class="event-status-strip">
      <span>Status: <strong>${isOpen ? "aberto" : "fechado"}</strong></span>
      <span>Inicio: <strong>${escapeHtml(formatDateTime(event.createdAt))}</strong></span>
      <span>Limite: <strong>${escapeHtml(formatDateTime(getEventDeadline(event)))}</strong></span>
      ${event.endedAt ? `<span>Fim: <strong>${escapeHtml(formatDateTime(event.endedAt))}</strong></span>` : ""}
    </section>

    <form id="event-form" class="form-card">
      <h2>Editar ficha do evento</h2>
      <label>
        <span>Nome</span>
        <input name="name" maxlength="60" value="${escapeHtml(event.name)}" ${isOpen ? "" : "disabled"} />
      </label>
      <label>
        <span>Descricao</span>
        <textarea name="description" maxlength="180" ${isOpen ? "" : "disabled"}>${escapeHtml(event.description || "")}</textarea>
      </label>
      <label>
        <span>Local ou mesa</span>
        <input name="locationLabel" maxlength="60" value="${escapeHtml(event.locationLabel || "")}" ${isOpen ? "" : "disabled"} />
      </label>
      <label>
        <span>Vibe oficial</span>
        <input name="vibe" maxlength="60" value="${escapeHtml(event.vibe || "")}" ${isOpen ? "" : "disabled"} />
      </label>
      <div class="button-row">
        ${button({ label: "Salvar", type: "submit", variant: "primary", disabled: !isOpen })}
        ${button({ label: "Encerrar evento", variant: "danger", id: "end-event-btn", disabled: !isOpen })}
      </div>
    </form>

    <section class="section-block">
      <div class="section-title-row">
        <h2>Participantes</h2>
        <a href="${ROUTES.PLAYERS}" class="text-link">gerenciar</a>
      </div>
      <div class="participant-cloud">
        ${participants.map((player) => `<span>${escapeHtml(player.name)}</span>`).join("") || "<span>Sem participantes</span>"}
      </div>
    </section>
  `;
}
