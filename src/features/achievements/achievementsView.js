import { ACHIEVEMENT_DEFINITIONS } from "../../domain/achievementRules.js";
import { badge } from "../../ui/components/badge.js";
import { escapeHtml, formatShortDateTime } from "../../utils/formatters.js";

export function achievementsView({ unlocked = [] }) {
  const unlockedMap = new Map(unlocked.map((achievement) => [achievement.key, achievement]));

  return `
    <section class="screen-heading">
      <p class="eyebrow">badges e titulos</p>
      <h1>Conquistas</h1>
    </section>

    <section class="achievement-grid">
      ${ACHIEVEMENT_DEFINITIONS.map((definition) => {
        const achievement = unlockedMap.get(definition.key);
        return `
          <article class="achievement-card ${achievement ? "is-unlocked" : ""}">
            <div class="achievement-card__icon">${achievement ? "OK" : "??"}</div>
            <h2>${escapeHtml(definition.title)}</h2>
            <p>${escapeHtml(definition.description)}</p>
            ${
              achievement
                ? `${badge("desbloqueada", "success")}<small>${escapeHtml(formatShortDateTime(achievement.unlockedAt))}</small>`
                : badge("bloqueada", "neutral")
            }
          </article>
        `;
      }).join("")}
    </section>
  `;
}
