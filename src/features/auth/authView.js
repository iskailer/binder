import { button } from "../../ui/components/button.js";
import { escapeHtml } from "../../utils/formatters.js";
import { getAvatar } from "../../services/avatarService.js";

export function authView({ players = [] }) {
  return `
    <section class="auth-screen">
      <div class="auth-card">
        <img class="auth-card__mark" src="./assets/icons/icon.svg" alt="" />
        <p class="eyebrow">RPG social offline-first</p>
        <h1>Roleta Brusca</h1>
        <p class="lede">Pontue causos, valide bravuras e transforme a noite em ranking local.</p>

        ${button({ label: "Entrar com Google", type: "button", variant: "primary", size: "large", id: "google-login-btn" })}

        <div class="auth-divider">
          <span>ou crie um jogador local</span>
        </div>

        <form id="create-player-form" class="form-stack">
          <label>
            <span>Apelido do jogador</span>
            <input name="name" autocomplete="nickname" maxlength="32" placeholder="Ex: Bruxo do Pagode" required />
          </label>
          ${button({ label: "Criar jogador sem login", type: "submit", variant: "ghost", size: "large" })}
        </form>

        <div class="auth-warning">
          <strong>Atencao:</strong> Sem login com Google, seus dados ficam apenas neste aparelho. 
          Se limpar o navegador ou trocar de celular, voce pode perder todo o progresso.
        </div>
      </div>

      ${
        players.length
          ? `<section class="section-block">
              <h2>Jogadores neste aparelho</h2>
              <div class="player-list">
                ${players
                  .map((player) => {
                    const avatar = getAvatar(player.avatarType);
                    return `
                      <button class="player-row" type="button" data-select-player="${escapeHtml(player.id)}">
                        <img src="${escapeHtml(avatar.image)}" alt="" />
                        <span>
                          <strong>${escapeHtml(player.name)}</strong>
                          <small>Nivel ${escapeHtml(player.level)}</small>
                        </span>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            </section>`
          : ""
      }
    </section>
  `;
}
