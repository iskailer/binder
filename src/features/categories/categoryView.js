import { scoreBadge } from "../../ui/components/badge.js";
import { button } from "../../ui/components/button.js";
import { escapeHtml } from "../../utils/formatters.js";

export function categoryView({ categories = [], event }) {
  return `
    <section class="screen-heading">
      <p class="eyebrow">grimorio fixo</p>
      <h1>Categorias</h1>
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
                  data: { requestCategory: category.id },
                  disabled: !event
                })}
              </footer>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}
