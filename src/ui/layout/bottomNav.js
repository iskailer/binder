import { ROUTES } from "../../utils/constants.js";

const items = [
  { href: ROUTES.HOME, label: "Base" },
  { href: ROUTES.PLAY, label: "Jogar" },
  { href: ROUTES.RANKING, label: "Ranking" },
  { href: ROUTES.PROFILE, label: "Perfil" },
  { href: ROUTES.PLAYERS, label: "Galera" }
];

export function bottomNav(activeRoute) {
  return `
    <nav class="bottom-nav" aria-label="Navegacao principal">
      ${items
        .map(
          (item) => `
            <a class="${activeRoute === item.href ? "is-active" : ""}" href="${item.href}">
              <span>${item.label}</span>
            </a>
          `
        )
        .join("")}
    </nav>
  `;
}
