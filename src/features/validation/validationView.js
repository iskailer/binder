import { button } from "../../ui/components/button.js";
import { badge } from "../../ui/components/badge.js";
import { emptyState } from "../../ui/components/emptyState.js";
import { getAvatar } from "../../services/avatarService.js";
import { EVENT_STATUS, VALIDATION_STATUS, ROUTES } from "../../utils/constants.js";
import { escapeHtml, formatDistanceMeters, formatShortDateTime } from "../../utils/formatters.js";
import { secondsUntil } from "../../utils/time.js";

export function validationView({
  event,
  activePlayer,
  participants = [],
  categories = [],
  validations = [],
  selectedCategoryId
}) {
  if (!event) {
    return emptyState({
      title: "Sem evento aberto",
      message: "Codigo sem evento e tipo um karaoke sem microfone.",
      action: `<a class="btn btn--primary btn--large" href="${ROUTES.HOME}">Voltar para base</a>`
    });
  }

  if (event.status !== EVENT_STATUS.OPEN) {
    return emptyState({
      title: "Evento fechado",
      message: "Pontuacao nova so entra em evento aberto.",
      action: `<a class="btn btn--primary btn--large" href="${ROUTES.HOME}">Ir para base</a>`
    });
  }

  const requested = validations.filter((item) => item.status === VALIDATION_STATUS.REQUESTED);
  const activeCodes = validations.filter((item) => item.status === VALIDATION_STATUS.ACTIVE);
  const hasEnoughPlayers = participants.length > 1;

  return `
    <section class="screen-heading">
      <p class="eyebrow">validacao geolocalizada</p>
      <h1>Codigo relampago</h1>
    </section>

    <section class="validation-layout">
      <form id="request-validation-form" class="form-card">
        <h2>Solicitar validacao</h2>
        <label>
          <span>Categoria</span>
          <select name="categoryId" required>
            ${categories
              .map(
                (category) => `
                  <option value="${escapeHtml(category.id)}" ${category.id === selectedCategoryId ? "selected" : ""}>
                    ${escapeHtml(category.name)} · ${escapeHtml(category.points)} XP
                  </option>
                `
              )
              .join("")}
          </select>
        </label>
        <div class="active-player-box">
          ${playerMini(activePlayer)}
          <span>vai pontuar</span>
        </div>
        ${button({ label: "Pontuar", type: "submit", variant: "primary", disabled: !hasEnoughPlayers })}
        ${!hasEnoughPlayers ? `<p class="form-hint">Adicione outro participante para liberar codigo.</p>` : ""}
      </form>

      <section class="form-card">
        <h2>Gerar codigo (Sidekick)</h2>
        ${
          requested.length
            ? requested.map((request) => renderRequest(request, participants, categories)).join("")
            : `<p class="muted">Nenhum pedido aguardando.</p>`
        }
      </section>

      <form id="consume-code-form" class="form-card">
        <h2>Inserir codigo</h2>
        <label>
          <span>Codigo</span>
          <input name="code" inputmode="text" autocomplete="one-time-code" maxlength="8" placeholder="ABCDE" required />
        </label>
        <div class="active-player-box">
          ${playerMini(activePlayer)}
          <span>recebe os pontos</span>
        </div>
        ${button({ label: "Validar e pontuar", type: "submit", variant: "primary" })}
      </form>
    </section>

    <section class="section-block">
      <h2>Codigos ativos</h2>
      ${
        activeCodes.length
          ? `<div class="code-list">${activeCodes.map((code) => renderActiveCode(code, participants, categories)).join("")}</div>`
          : `<p class="muted">Nada piscando no pergaminho agora.</p>`
      }
    </section>
  `;
}

function renderRequest(request, participants, categories) {
  const target = participants.find((player) => player.id === request.targetPlayerId);
  const category = categories.find((item) => item.id === request.categoryId);
  const validators = participants.filter((player) => player.id !== request.targetPlayerId);

  return `
    <article class="request-card">
      <div>
        <strong>${escapeHtml(category?.name || "Categoria")}</strong>
        <small>${escapeHtml(target?.name || "Jogador")} pediu as ${escapeHtml(formatShortDateTime(request.requestedAt))}</small>
      </div>
      <label>
        <span>Validador (Sidekick)</span>
        <select data-validator-select="${escapeHtml(request.id)}">
          ${validators
            .map((player) => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`)
            .join("")}
        </select>
      </label>
      ${button({ label: "Gerar", variant: "secondary", data: { generateCode: request.id }, disabled: !validators.length })}
    </article>
  `;
}

function renderActiveCode(code, participants, categories) {
  const target = participants.find((player) => player.id === code.targetPlayerId);
  const validator = participants.find((player) => player.id === code.generatedByPlayerId);
  const category = categories.find((item) => item.id === code.categoryId);
  const remaining = secondsUntil(code.expiresAt);

  return `
    <article class="code-card">
      <div>
        <span class="code-card__code">${escapeHtml(code.code)}</span>
        ${badge(`${remaining}s`, remaining <= 5 ? "danger" : "score")}
      </div>
      <p>${escapeHtml(target?.name || "Alvo")} · ${escapeHtml(category?.name || "categoria")}</p>
      <small>${escapeHtml(validator?.name || "Sidekick")} a ${escapeHtml(formatDistanceMeters(code.metadata?.distanceMeters))}</small>
    </article>
  `;
}

function playerMini(player) {
  const avatar = getAvatar(player.avatarType);
  return `
    <span class="mini-player">
      <img src="${escapeHtml(avatar.image)}" alt="" />
      <strong>${escapeHtml(player.name)}</strong>
    </span>
  `;
}
