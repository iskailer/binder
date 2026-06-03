import { escapeHtml } from "../../utils/formatters.js";

export function button({
  label,
  type = "button",
  variant = "primary",
  size = "normal",
  className = "",
  id = "",
  disabled = false,
  data = {}
}) {
  const dataAttrs = Object.entries(data)
    .map(([key, value]) => `data-${escapeHtml(key)}="${escapeHtml(value)}"`)
    .join(" ");

  return `
    <button
      ${id ? `id="${escapeHtml(id)}"` : ""}
      class="btn btn--${escapeHtml(variant)} btn--${escapeHtml(size)} ${escapeHtml(className)}"
      type="${escapeHtml(type)}"
      ${disabled ? "disabled" : ""}
      ${dataAttrs}
    >${escapeHtml(label)}</button>
  `;
}
