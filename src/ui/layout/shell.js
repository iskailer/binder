import { bottomNav } from "./bottomNav.js";
import { header } from "./header.js";

export function shell({ content, route, player, event, isOnline }) {
  return `
    <div class="app-frame">
      ${header({ player, event, isOnline })}
      <main id="screen" class="screen" tabindex="-1">${content}</main>
      ${player ? bottomNav(route) : ""}
    </div>
  `;
}
