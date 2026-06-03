import { badge } from "../../ui/components/badge.js";
import { emptyState } from "../../ui/components/emptyState.js";
import { getAvatar } from "../../services/avatarService.js";
import { escapeHtml } from "../../utils/formatters.js";

export function playerView({ participants = [], activePlayer, event }) {
  if (!event) {
    return emptyState({
      title: "Sem evento ativo",
      message: "Entre em um evento para ver quem esta participando.",
      action: `<a class="btn btn--primary btn--large" href="#/home">Voltar para base</a>`
    });
  }

  if (!participants.length) {
    return emptyState({
      title: "Ninguem por aqui ainda",
      message: "Voce e o primeiro! Compartilhe o evento para mais gente entrar.",
      action: `<a class="btn btn--primary btn--large" href="#/home">Voltar para base</a>`
    });
  }

  return `
    <section class="screen-heading">
      <p class="eyebrow">participantes do evento</p>
      <h1>Galera do role</h1>
      <p class="muted">Apenas jogadores que entraram no evento aparecem aqui. Cada pessoa se cadastra com seu proprio aparelho.</p>
    </section>

    <section class="player-list">
      ${participants
        .map((player) => {
          const avatar = getAvatar(player.avatarType);
          const isActive = player.id === activePlayer?.id;
          return `
            <article class="player-row player-row--article ${isActive ? "is-active" : ""}">
              <img src="${escapeHtml(avatar.image)}" alt="" />
              <div>
                <strong>${escapeHtml(player.name)}</strong>
                <small>Nivel ${escapeHtml(player.level)} · ${escapeHtml(player.xp)} XP</small>
                <span class="badge-line">
                  ${isActive ? badge("voce", "success") : ""}
                  ${badge("no evento", "score")}
                </span>
              </div>
            </article>
          `;
        })
        .join("")}
    </section>
  `;
}
