import { escapeHtml } from "../../utils/formatters.js";

export function toast(message, variant = "success") {
  return `<div class="toast toast--${escapeHtml(variant)}" role="status">${escapeHtml(message)}</div>`;
}
