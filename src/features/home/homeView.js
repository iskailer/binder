import { button } from "../../ui/components/button.js";
import { badge } from "../../ui/components/badge.js";
import { emptyState } from "../../ui/components/emptyState.js";
import { getEventDeadline } from "../../domain/eventRules.js";
import { formatDateTime, formatPoints, escapeHtml } from "../../utils/formatters.js";
import { EVENT_STATUS, ROUTES } from "../../utils/constants.js";

export function homeView({ player, event, ranking = [], isOnline }) {
  const leader = ranking[0];
  const hasOpenEvent = event?.status === EVENT_STATUS.OPEN;

  return `
    <section class="hero-panel">
      <img src="./assets/images/arena.svg" alt="" />
      <div class="hero-panel__content">
        <p class="eyebrow">campanha local</p>
        <h1>${escapeHtml(event?.name || "Roleta Brusca")}</h1>
        <p>${escapeHtml(player.name)}, sua ficha esta pronta para o caos social regulamentado.</p>
        <div class="hero-panel__actions">
          ${
            hasOpenEvent
              ? button({ label: "Abrir evento", variant: "secondary", data: { route: ROUTES.EVENT } })
              : ""
          }
          ${hasOpenEvent ? button({ label: "Jogar", variant: "ghost", data: { route: ROUTES.PLAY } }) : ""}
        </div>
      </div>
    </section>

    ${!isOnline ? `<section class="offline-banner">Modo offline ativo. Dados seguem salvos no PouchDB local.</section>` : ""}

    ${!hasOpenEvent ? `
      <section class="section-block" id="event-search-section">
        <h2>Procurando evento na area...</h2>
        <div id="nearby-search-status">
          <div class="nearby-searching">
            <span class="loader" style="width:1.5rem;height:1.5rem;border-width:0.2rem"></span>
            <span>Buscando eventos geograficos em ate 50m...</span>
          </div>
        </div>
        <div id="nearby-event-found" style="display:none;margin-top:0.75rem"></div>
        <div id="create-event-area" style="display:none;margin-top:1rem">
          <p class="muted">Nenhum evento encontrado por perto. Crie o seu!</p>
          ${button({ label: "Iniciar Evento", variant: "primary", size: "large", id: "start-event-btn" })}
        </div>
      </section>
    ` : ""}

    ${
      hasOpenEvent
        ? `<section class="dashboard-grid">
            <article class="metric-card metric-card--hot">
              <span>Evento</span>
              <strong>Aberto</strong>
              <small>fecha ate ${escapeHtml(formatDateTime(getEventDeadline(event)))}</small>
            </article>
            <article class="metric-card">
              <span>Participantes</span>
              <strong>${escapeHtml(event.participants?.length || 0)}</strong>
              <small>fichas na mesa</small>
            </article>
            <article class="metric-card">
              <span>Lider</span>
              <strong>${escapeHtml(leader?.playerName || "ninguem ainda")}</strong>
              <small>${escapeHtml(formatPoints(leader?.points || 0))}</small>
            </article>
          </section>

          <section class="quick-actions">
            ${button({ label: "Jogar", variant: "primary", data: { route: ROUTES.PLAY } })}
            ${button({ label: "🎲 Roleta", variant: "primary", data: { route: ROUTES.ROULETTE } })}
            ${button({ label: "Categorias", variant: "secondary", data: { route: ROUTES.CATEGORIES } })}
            ${button({ label: "Ranking", variant: "secondary", data: { route: ROUTES.RANKING } })}
            ${button({ label: "Galera", variant: "secondary", data: { route: ROUTES.PLAYERS } })}
          </section>`
        : ""
    }
  `;
}
