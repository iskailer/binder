import { escapeHtml } from "../../utils/formatters.js";

export function modal({ id, title, body, footer = "" }) {
  return `
    <dialog class="modal" id="${escapeHtml(id)}">
      <form method="dialog" class="modal__content">
        <header class="modal__header">
          <h2>${escapeHtml(title)}</h2>
          <button class="icon-btn" value="cancel" aria-label="Fechar" type="submit">x</button>
        </header>
        <div class="modal__body">${body}</div>
        ${footer ? `<footer class="modal__footer">${footer}</footer>` : ""}
      </form>
    </dialog>
  `;
}
