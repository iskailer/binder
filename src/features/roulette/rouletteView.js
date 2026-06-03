import { button } from "../../ui/components/button.js";
import { emptyState } from "../../ui/components/emptyState.js";
import { scoreBadge } from "../../ui/components/badge.js";
import { escapeHtml } from "../../utils/formatters.js";

export function rouletteView({ categories = [], event, challenge, timeLeft, status }) {
  if (!event) {
    return emptyState({
      title: "Sem evento ativo",
      message: "Inicie um evento para girar a roleta de desafios.",
      action: `<a class="btn btn--primary btn--large" href="#/home">Voltar para base</a>`
    });
  }

  if (categories.length < 2) {
    return emptyState({
      title: "Categorias insuficientes",
      message: "Precisa de pelo menos 2 categorias ativas para girar a roleta.",
      action: `<a class="btn btn--primary btn--large" href="#/home">Voltar</a>`
    });
  }

  return `
    <section class="screen-heading">
      <p class="eyebrow">🎲 roleta de desafios</p>
      <h1>Gira que gira</h1>
      <p class="lede">Gire a roleta, aceite o desafio e complete em 10 minutos para ganhar <strong>+10% bonus</strong> de XP.</p>
    </section>

    ${renderWheel(categories)}
    ${renderChallengePanel(challenge, timeLeft, status)}
  `;
}

function renderWheel(categories) {
  const sliceAngle = 360 / categories.length;

  return `
    <section class="roulette-arena" aria-label="Roleta de desafios">
      <div class="roulette-pointer" aria-hidden="true">▼</div>
      <div class="roulette-wheel" id="roulette-wheel">
        <svg viewBox="0 0 300 300" class="roulette-svg" aria-hidden="true">
          ${categories.map((cat, i) => renderSlice(cat, i, sliceAngle, categories.length)).join("")}
        </svg>
      </div>
      <div class="roulette-center" id="roulette-spin-btn" role="button" tabindex="0" aria-label="Girar roleta">
        <span>GIRAR</span>
      </div>
    </section>
  `;
}

function renderSlice(category, index, sliceAngle, total) {
  const cx = 150, cy = 150, r = 140;
  const startAngle = index * sliceAngle - 90;
  const endAngle = startAngle + sliceAngle;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArc = sliceAngle > 180 ? 1 : 0;

  const colors = [
    "rgba(255,203,5,0.55)", "rgba(36,209,126,0.55)", "rgba(255,77,141,0.55)",
    "rgba(56,189,248,0.55)", "rgba(255,90,79,0.55)", "rgba(168,85,247,0.55)",
    "rgba(251,146,60,0.55)", "rgba(34,211,238,0.55)", "rgba(163,230,53,0.55)",
    "rgba(244,114,182,0.55)", "rgba(129,140,248,0.55)"
  ];
  const color = colors[index % colors.length];

  // Text label - positioned at middle of arc
  const midAngle = startAngle + sliceAngle / 2;
  const midRad = (midAngle * Math.PI) / 180;
  const labelR = r * 0.62;
  const labelX = cx + labelR * Math.cos(midRad);
  const labelY = cy + labelR * Math.sin(midRad);

  // Truncate name to fit
  const maxLen = total > 8 ? 10 : 16;
  const label = category.name.length > maxLen
    ? category.name.slice(0, maxLen - 1) + "…"
    : category.name;

  return `
    <path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z"
          fill="${color}" stroke="rgba(255,255,255,0.2)" stroke-width="1"
          data-slice="${index}" />
    <text x="${labelX}" y="${labelY}"
          text-anchor="middle" dominant-baseline="middle"
          transform="rotate(${midAngle}, ${labelX}, ${labelY})"
          fill="#fff" font-size="${total > 8 ? 8 : 10}" font-weight="800">
      ${escapeHtml(label)}
    </text>
  `;
}

function renderChallengePanel(challenge, timeLeft, status) {
  if (status === "spinning") {
    return `
      <section class="roulette-challenge roulette-challenge--spinning">
        <p class="roulette-challenge__label">Girando...</p>
      </section>
    `;
  }

  if (!challenge) {
    return `
      <section class="roulette-challenge roulette-challenge--idle">
        <p class="roulette-challenge__label">Toque em <strong>GIRAR</strong> para sortear um desafio</p>
      </section>
    `;
  }

  if (status === "expired") {
    return `
      <section class="roulette-challenge roulette-challenge--expired">
        <p class="eyebrow">tempo esgotado</p>
        <h2>${escapeHtml(challenge.name)}</h2>
        <p>${escapeHtml(challenge.description)}</p>
        <p class="roulette-challenge__timer">⏱️ 00:00</p>
        <p class="muted">O tempo acabou. Voce ainda pode pontuar normalmente sem o bonus.</p>
        <div class="button-row">
          ${button({ label: "Girar novamente", variant: "ghost", id: "roulette-reset-btn" })}
          ${button({ label: "Pontuar sem bonus", variant: "secondary", id: "roulette-score-normal-btn", data: { category: challenge.id } })}
        </div>
      </section>
    `;
  }

  // Active challenge
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = timeLeft <= 60;

  return `
    <section class="roulette-challenge roulette-challenge--active">
      <p class="eyebrow">desafio sorteado</p>
      <h2>${escapeHtml(challenge.name)}</h2>
      <p>${escapeHtml(challenge.description)}</p>
      <div class="roulette-reward">
        ${scoreBadge(challenge.points)}
        <span class="badge badge--success">+10% bonus</span>
      </div>
      <p class="roulette-challenge__timer ${isUrgent ? "roulette-challenge__timer--urgent" : ""}" id="roulette-timer">
        ⏱️ ${timeStr}
      </p>
      <div class="button-row">
        ${button({ label: "Completei! Pedir validacao", variant: "primary", size: "large", id: "roulette-validate-btn", data: { category: challenge.id } })}
        ${button({ label: "Desistir", variant: "ghost", id: "roulette-reset-btn" })}
      </div>
    </section>
  `;
}
