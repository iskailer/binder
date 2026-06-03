import { scoreBadge } from "../../ui/components/badge.js";
import { button } from "../../ui/components/button.js";
import { emptyState } from "../../ui/components/emptyState.js";
import { escapeHtml } from "../../utils/formatters.js";

export function playView({ categories = [], event, showInput = null, activeCodes = [] }) {
  if (!event) {
    return emptyState({
      title: "Sem evento ativo",
      message: "Inicie ou entre em um evento para poder jogar.",
      action: `<a class="btn btn--primary btn--large" href="#/home">Voltar para base</a>`
    });
  }

  return `
    <section class="screen-heading">
      <p class="eyebrow">hora de pontuar</p>
      <h1>Jogar</h1>
    </section>

    <section class="section-block" style="margin-bottom:1rem;text-align:center">
      <p class="eyebrow">🎲 quer mais adrenalina?</p>
      <p>Gire a roleta de desafios e ganhe <strong>+10% bonus</strong> se completar em 10 minutos.</p>
      <a class="btn btn--primary" href="#/roleta">Abrir Roleta</a>
    </section>

    ${activeCodes.length ? `
      <section class="section-block">
        <h2>Seus codigos ativos (Sidekick)</h2>
        <div class="code-list">
          ${activeCodes.map((c) => `
            <article class="code-card">
              <div>
                <span class="code-card__code">${escapeHtml(c.code)}</span>
              </div>
              <small>Expira em ${escapeHtml(Math.max(0, Math.ceil((new Date(c.expiresAt) - new Date()) / 1000)))}s</small>
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}

    <section class="section-block">
      <h2>Validar codigo de parceiro</h2>
      <form id="validate-sidekick-form" class="form-card">
        <label>
          <span>Codigo do parceiro</span>
          <input name="sidekickCode" inputmode="text" autocomplete="one-time-code" maxlength="8" placeholder="EX: ABC123" required />
        </label>
        ${button({ label: "Validar e Pontuar", type: "submit", variant: "primary", size: "large" })}
      </form>
    </section>

    <div class="category-grid">
      ${categories
        .map(
          (category) => `
            <article class="category-card">
              <div>
                <h2>${escapeHtml(category.name)}</h2>
                <p>${escapeHtml(category.description)}</p>
              </div>
              <footer>
                ${scoreBadge(category.points)}
                ${button({
                  label: "Pontuar",
                  variant: "secondary",
                  data: { "pontuar-category": category.id }
                })}
              </footer>
            </article>
          `
        )
        .join("")}
    </div>

    <dialog id="pontuar-dialog" class="modal">
      <form method="dialog" class="modal__content form-card" id="pontuar-form">
        <header class="modal__header">
          <h2>Gerar codigo Sidekick</h2>
          <button class="icon-btn" value="cancel" aria-label="Fechar" type="submit">x</button>
        </header>
        <div class="modal__body">
          <p>Ao gerar, seu amigo tera <strong>60 segundos</strong> para usar o codigo. Ambos pontuam.</p>
          <input type="hidden" name="categoryId" id="pontuar-category-id" />
        </div>
        <footer class="modal__footer">
          ${button({ label: "Gerar Codigo", type: "button", variant: "primary", id: "confirm-generate-btn" })}
        </footer>
      </form>
    </dialog>
  `;
}
