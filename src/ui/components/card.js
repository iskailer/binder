import { escapeHtml } from "../../utils/formatters.js";

export function card({ title = "", eyebrow = "", body = "", footer = "", className = "" }) {
  return `
    <section class="card ${escapeHtml(className)}">
      ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
      ${title ? `<h2>${escapeHtml(title)}</h2>` : ""}
      ${body}
      ${footer ? `<footer class="card__footer">${footer}</footer>` : ""}
    </section>
  `;
}
