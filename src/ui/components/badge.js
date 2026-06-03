import { escapeHtml } from "../../utils/formatters.js";

export function badge(label, variant = "neutral") {
  return `<span class="badge badge--${escapeHtml(variant)}">${escapeHtml(label)}</span>`;
}

export function scoreBadge(points) {
  return badge(`${Number(points || 0)} XP`, "score");
}
