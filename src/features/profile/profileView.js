import { badge } from "../../ui/components/badge.js";
import { getAvatar } from "../../services/avatarService.js";
import { getPrimaryTitle, xpForNextLevel, getNextTitleInfo } from "../../domain/levelRules.js";
import { SCORE_TYPES, ROUTES } from "../../utils/constants.js";
import { escapeHtml, formatShortDateTime } from "../../utils/formatters.js";

export function profileView({ player, scores = [], achievements = [] }) {
  const avatar = getAvatar(player.avatarType);
  const nextLevelXp = xpForNextLevel(player.level);
  const progressPercent = Math.min(100, Math.round((Number(player.xp || 0) / nextLevelXp) * 100));
  const actionCount = scores.filter((score) => score.type === SCORE_TYPES.ACTION).length;
  const sidekickCount = scores.filter((score) => score.type === SCORE_TYPES.SIDEKICK).length;
  const nextTitle = getNextTitleInfo(player.level);

  return `
    <section class="profile-hero">
      <img src="${escapeHtml(avatar.image)}" alt="" />
      <div>
        <p class="eyebrow">ficha do jogador</p>
        <h1>${escapeHtml(player.name)}</h1>
        <p>${escapeHtml(getPrimaryTitle(player))}</p>
      </div>
    </section>

    <section class="dashboard-grid">
      <article class="metric-card metric-card--hot">
        <span>Nivel</span>
        <strong>${escapeHtml(player.level)}</strong>
        <small>${escapeHtml(player.xp)} XP total</small>
      </article>
      <article class="metric-card">
        <span>Acoes</span>
        <strong>${escapeHtml(actionCount)}</strong>
        <small>validadas</small>
      </article>
      <article class="metric-card">
        <span>Sidekick</span>
        <strong>${escapeHtml(sidekickCount)}</strong>
        <small>bonus recebidos</small>
      </article>
    </section>

    <section class="section-block">
      <h2>Progresso</h2>
      <div class="progress-track"><span style="width:${progressPercent}%"></span></div>
      <p class="muted">${escapeHtml(Math.max(0, nextLevelXp - Number(player.xp || 0)))} XP ate o proximo nivel</p>
      ${nextTitle ? `
        <article class="metric-card" style="margin-top:0.75rem">
          <span>Proximo titulo</span>
          <strong>${escapeHtml(nextTitle.title)}</strong>
          <small>Desbloqueado no nivel ${escapeHtml(nextTitle.level)}</small>
        </article>
      ` : `
        <article class="metric-card" style="margin-top:0.75rem">
          <span>Titulo maximo</span>
          <strong>${escapeHtml(getPrimaryTitle(player))}</strong>
          <small>Voce ja alcancou o titulo mais alto!</small>
        </article>
      `}
      <div class="badge-line" style="margin-top:0.5rem">
        ${(player.titles || []).map((title) => badge(title, "score")).join("")}
      </div>
    </section>

    <section class="section-block">
      <div class="section-title-row">
        <h2>Conquistas</h2>
        <a class="text-link" href="${ROUTES.ACHIEVEMENTS}">ver todas</a>
      </div>
      <div class="badge-line">
        ${achievements.slice(0, 4).map((achievement) => badge(achievement.title, "success")).join("") || badge("nenhuma ainda", "neutral")}
      </div>
    </section>

    <section class="section-block">
      <h2>Historico recente</h2>
      ${
        scores.length
          ? `<div class="score-feed">
              ${scores
                .slice(0, 8)
                .map(
                  (score) => `
                    <article>
                      <strong>${score.type === SCORE_TYPES.SIDEKICK ? "Sidekick" : escapeHtml(score.metadata?.categoryName || "Acao")}</strong>
                      <span>+${escapeHtml(score.points)} XP</span>
                      <small>${escapeHtml(formatShortDateTime(score.createdAt))}</small>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : `<p class="muted">Nenhuma pontuacao ainda.</p>`
      }
    </section>
  `;
}
