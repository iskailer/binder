import { badge } from "../../ui/components/badge.js";
import { emptyState } from "../../ui/components/emptyState.js";
import { getAvatar } from "../../services/avatarService.js";
import { EVENT_STATUS, ROUTES } from "../../utils/constants.js";
import { escapeHtml, formatDateTime, formatPoints } from "../../utils/formatters.js";

export function rankingView({ event, ranking = [] }) {
  if (!event) {
    return emptyState({
      title: "Ranking aguardando evento",
      message: "Sem noite aberta, sem podium, sem treta matematica.",
      action: `<a class="btn btn--primary btn--large" href="${ROUTES.HOME}">Ir para base</a>`
    });
  }

  const isClosed = event.status === EVENT_STATUS.CLOSED;

  return `
    <section class="screen-heading">
      <p class="eyebrow">${isClosed ? "snapshot final" : "ao vivo local"}</p>
      <h1>Ranking da noite</h1>
      ${isClosed && event.endedAt ? `<p>Encerrado em ${escapeHtml(formatDateTime(event.endedAt))}</p>` : ""}
    </section>

    <section class="ranking-list">
      ${ranking
        .map((row, index) => {
          const avatar = getAvatar(row.avatarType);
          return `
            <article class="ranking-row ${index === 0 ? "ranking-row--leader" : ""}">
              <span class="ranking-row__pos">${index + 1}</span>
              <img src="${escapeHtml(avatar.image)}" alt="" />
              <div>
                <strong>${escapeHtml(row.playerName)}</strong>
                <small>${escapeHtml(row.actions)} acoes · ${escapeHtml(row.sidekicks)} sidekicks</small>
              </div>
              <div class="ranking-row__score">
                <strong>${escapeHtml(row.points)}</strong>
                <small>${escapeHtml(formatPoints(row.points))}</small>
              </div>
            </article>
          `;
        })
        .join("")}
    </section>

    <section class="ranking-note">
      ${badge("desempate: acoes, depois chegada", "neutral")}
    </section>
  `;
}
