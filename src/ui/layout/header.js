import { APP_CONFIG } from "../../config/appConfig.js";
import { getAvatar } from "../../services/avatarService.js";
import { getPrimaryTitle } from "../../domain/levelRules.js";
import { EVENT_STATUS } from "../../utils/constants.js";
import { escapeHtml } from "../../utils/formatters.js";

export function header({ player, event, isOnline }) {
  const avatar = player ? getAvatar(player.avatarType) : null;
  const eventLabel = event?.status === EVENT_STATUS.OPEN ? "Evento aberto" : "Sem evento";

  return `
    <header class="topbar">
      <a class="brand" href="#/home" aria-label="${escapeHtml(APP_CONFIG.appName)}">
        <img src="./assets/icons/icon.svg" alt="" />
        <span>${escapeHtml(APP_CONFIG.appName)}</span>
      </a>
      <div class="topbar__status">
        <span class="status-pill ${isOnline ? "status-pill--online" : "status-pill--offline"}">
          ${isOnline ? "online" : "offline"}
        </span>
        <span class="status-pill">${escapeHtml(eventLabel)}</span>
      </div>
      ${
        player
          ? `<a class="player-chip" href="#/profile">
              <img src="${escapeHtml(avatar.image)}" alt="" />
              <span>
                <strong>${escapeHtml(player.name)}</strong>
                <small>${escapeHtml(getPrimaryTitle(player))}</small>
              </span>
            </a>`
          : ""
      }
    </header>
  `;
}
