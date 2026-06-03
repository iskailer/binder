import { button } from "../../ui/components/button.js";
import { badge } from "../../ui/components/badge.js";
import { getAvatar } from "../../services/avatarService.js";
import { escapeHtml } from "../../utils/formatters.js";

export function playerView({ players = [], activePlayer, event }) {
  return `
    <section class="screen-heading">
      <p class="eyebrow">party management</p>
      <h1>Galera do role</h1>
    </section>

    <form id="add-player-form" class="form-card">
      <h2>Novo participante local</h2>
      <label>
        <span>Apelido</span>
        <input name="name" maxlength="32" placeholder="Ex: Paladino do Karaokê" required />
      </label>
      ${button({ label: "Adicionar jogador", type: "submit", variant: "primary" })}
    </form>

    <section class="player-list">
      ${players
        .map((player) => {
          const avatar = getAvatar(player.avatarType);
          const isActive = player.id === activePlayer?.id;
          const isParticipant = event?.participants?.includes(player.id);
          return `
            <article class="player-row player-row--article ${isActive ? "is-active" : ""}">
              <img src="${escapeHtml(avatar.image)}" alt="" />
              <div>
                <strong>${escapeHtml(player.name)}</strong>
                <small>Nivel ${escapeHtml(player.level)} · ${escapeHtml(player.xp)} XP</small>
                <span class="badge-line">
                  ${isActive ? badge("ativo", "success") : ""}
                  ${isParticipant ? badge("no evento", "score") : badge("fora do evento", "neutral")}
                </span>
              </div>
              <div class="row-actions">
                ${button({ label: "Ativar", variant: "ghost", data: { activePlayer: player.id }, disabled: isActive })}
                ${
                  event && !isParticipant
                    ? button({ label: "Entrar", variant: "secondary", data: { joinPlayer: player.id } })
                    : ""
                }
              </div>
            </article>
          `;
        })
        .join("")}
    </section>
  `;
}
