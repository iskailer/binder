import { button } from "../../ui/components/button.js";
import { escapeHtml, formatDateTime } from "../../utils/formatters.js";

export function adminView({ authenticated = false, geoEvents = [], ranking = [], currentEventId = null }) {
  if (!authenticated) {
    return `
      <section class="screen-heading">
        <p class="eyebrow">acesso restrito</p>
        <h1>Admin</h1>
      </section>

      <form id="admin-login-form" class="form-card">
        <h2>Login de Administrador</h2>
        <p class="muted">Apenas administradores autorizados podem acessar este painel.</p>
        <label>
          <span>Email</span>
          <input name="email" type="email" placeholder="admin@exemplo.com" required />
        </label>
        <label>
          <span>Senha</span>
          <input name="password" type="password" placeholder="Sua senha" required />
        </label>
        ${button({ label: "Entrar", type: "submit", variant: "primary", size: "large" })}
      </form>
    `;
  }

  return `
    <section class="screen-heading">
      <p class="eyebrow">painel restrito</p>
      <h1>Admin</h1>
    </section>

    <form id="create-geo-event-form" class="form-card">
      <h2>Criar Evento Geografico</h2>
      <label>
        <span>Nome do evento</span>
        <input name="eventName" maxlength="60" placeholder="Ex: Roleta no Bar do Zeca" required />
      </label>
      <label>
        <span>Descricao</span>
        <textarea name="eventDescription" maxlength="180" placeholder="Descricao curta do evento"></textarea>
      </label>
      <label>
        <span>Raio de ativacao (metros)</span>
        <input name="radius" type="number" min="10" max="500" value="50" required />
      </label>
      <p class="form-hint">A localizacao sera capturada automaticamente ao criar.</p>
      ${button({ label: "Criar Evento Geo", type: "submit", variant: "primary", size: "large" })}
    </form>

    <section class="section-block">
      <h2>Eventos Geograficos Ativos</h2>
      ${geoEvents.length
        ? `<div class="player-list">
            ${geoEvents.map((ev) => `
              <article class="player-row player-row--article">
                <div>
                  <strong>${escapeHtml(ev.name)}</strong>
                  <small>Criado: ${escapeHtml(formatDateTime(ev.createdAt))}</small>
                  <small>Lat: ${escapeHtml(ev.location?.latitude?.toFixed(5) || "?")} / Lng: ${escapeHtml(ev.location?.longitude?.toFixed(5) || "?")}</small>
                  <small>Raio: ${escapeHtml(ev.radius || 50)}m</small>
                </div>
              </article>
            `).join("")}
          </div>`
        : `<p class="muted">Nenhum evento geografico ativo.</p>`
      }
    </section>

    ${currentEventId && ranking.length ? `
      <section class="section-block">
        <h2>Ranking em Tempo Real</h2>
        <div class="ranking-list">
          ${ranking.map((row, index) => `
            <article class="ranking-row ${index === 0 ? "ranking-row--leader" : ""}">
              <span class="ranking-row__pos">${index + 1}</span>
              <div>
                <strong>${escapeHtml(row.playerName)}</strong>
                <small>${escapeHtml(row.points)} pontos</small>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}
  `;
}
