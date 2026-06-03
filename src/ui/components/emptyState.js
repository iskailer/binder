import { escapeHtml } from "../../utils/formatters.js";

export function emptyState({ title, message = "", action = "" }) {
  return `
    <section class="empty-state">
      <div class="empty-state__sigil">RB</div>
      <h2>${escapeHtml(title)}</h2>
      ${message ? `<p>${escapeHtml(message)}</p>` : ""}
      ${action}
    </section>
  `;
}
