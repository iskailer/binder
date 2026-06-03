import { generateSidekickCode } from "../../services/sidekickService.js";
import { showToast } from "../../services/notificationService.js";
import { assertEventCanReceiveScore } from "../../domain/eventRules.js";
import { rouletteView } from "./rouletteView.js";

const ROULETTE_TIMER_SECONDS = 600; // 10 minutes
const ROULETTE_BONUS_RATE = 0.10; // 10% bonus
const SPIN_DURATION_MS = 4000;

let rouletteState = {
  challenge: null,
  startedAt: null,
  status: "idle" // idle | spinning | active | expired
};

let countdownInterval = null;

export async function render(context) {
  const timeLeft = getTimeLeft();
  if (rouletteState.status === "active" && timeLeft <= 0) {
    rouletteState.status = "expired";
  }

  return rouletteView({
    categories: context.categories,
    event: context.event,
    challenge: rouletteState.challenge,
    timeLeft,
    status: rouletteState.status
  });
}

export function bind(context) {
  const spinBtn = document.getElementById("roulette-spin-btn");
  const wheel = document.getElementById("roulette-wheel");

  spinBtn?.addEventListener("click", () => handleSpin(context, wheel));
  spinBtn?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSpin(context, wheel);
    }
  });

  document.getElementById("roulette-validate-btn")?.addEventListener("click", () => {
    handleValidate(context);
  });

  document.getElementById("roulette-score-normal-btn")?.addEventListener("click", () => {
    handleScoreNormal(context);
  });

  document.getElementById("roulette-reset-btn")?.addEventListener("click", () => {
    resetRoulette();
    context.refresh();
  });

  // Start countdown if active
  if (rouletteState.status === "active") {
    startCountdown(context);
  }
}

function handleSpin(context, wheelEl) {
  if (rouletteState.status === "spinning" || rouletteState.status === "active") return;
  if (!context.event) {
    showToast("Inicie um evento antes de girar.", "error");
    return;
  }
  if (context.categories.length < 2) {
    showToast("Precisa de pelo menos 2 categorias.", "error");
    return;
  }

  rouletteState.status = "spinning";

  // Pick random category
  const randomIndex = Math.floor(Math.random() * context.categories.length);
  const chosen = context.categories[randomIndex];

  // Calculate rotation
  const sliceAngle = 360 / context.categories.length;
  // Target: align the chosen slice with the top pointer (at 0deg/360deg)
  // The pointer is at the top, slices start from -90deg in SVG
  const targetSliceCenter = randomIndex * sliceAngle + sliceAngle / 2;
  // We need to rotate so the target center aligns with the top (270deg in CSS transform terms)
  const baseRotation = 360 - targetSliceCenter;
  const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
  const totalRotation = fullSpins * 360 + baseRotation;

  if (wheelEl) {
    wheelEl.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1)`;
    wheelEl.style.transform = `rotate(${totalRotation}deg)`;
  }

  // Update panel to show spinning state
  updateChallengePanel("spinning", null, 0);

  setTimeout(() => {
    rouletteState.challenge = chosen;
    rouletteState.startedAt = Date.now();
    rouletteState.status = "active";

    // Reset wheel transform for next spin (keep visual position)
    if (wheelEl) {
      wheelEl.style.transition = "none";
      wheelEl.style.transform = `rotate(${baseRotation}deg)`;
    }

    context.refresh();
  }, SPIN_DURATION_MS);
}

function handleValidate(context) {
  const challenge = rouletteState.challenge;
  if (!challenge) return;

  const timeLeft = getTimeLeft();
  const hasBonus = timeLeft > 0;

  // Generate a sidekick code for validation
  try {
    assertEventCanReceiveScore(context.event);

    const sidekickCode = generateSidekickCode({
      generatorPlayerId: context.player.id,
      categoryId: challenge.id,
      eventId: context.event.id
    });

    const bonusMsg = hasBonus
      ? " Bonus de 10% garantido ao validar dentro do tempo!"
      : "";

    // Store bonus info in sessionStorage for the validation flow
    if (hasBonus) {
      sessionStorage.setItem("roletabrusca.rouletteBonus", JSON.stringify({
        categoryId: challenge.id,
        bonusRate: ROULETTE_BONUS_RATE,
        expiresAt: new Date(rouletteState.startedAt + ROULETTE_TIMER_SECONDS * 1000).toISOString()
      }));
    }

    showToast(`Codigo ${sidekickCode.code} gerado!${bonusMsg}`, "success");
    resetRoulette();
    setTimeout(() => context.refresh(), 400);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function handleScoreNormal(context) {
  const challenge = rouletteState.challenge;
  if (!challenge) return;

  try {
    assertEventCanReceiveScore(context.event);

    const sidekickCode = generateSidekickCode({
      generatorPlayerId: context.player.id,
      categoryId: challenge.id,
      eventId: context.event.id
    });

    showToast(`Codigo ${sidekickCode.code} gerado! Sem bonus de tempo.`, "success");
    resetRoulette();
    setTimeout(() => context.refresh(), 400);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function startCountdown(context) {
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const timeLeft = getTimeLeft();
    const timerEl = document.getElementById("roulette-timer");

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      rouletteState.status = "expired";
      context.refresh();
      return;
    }

    if (timerEl) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerEl.textContent = `⏱️ ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      timerEl.classList.toggle("roulette-challenge__timer--urgent", timeLeft <= 60);
    }
  }, 1000);
}

function getTimeLeft() {
  if (!rouletteState.startedAt) return 0;
  const elapsed = Math.floor((Date.now() - rouletteState.startedAt) / 1000);
  return Math.max(0, ROULETTE_TIMER_SECONDS - elapsed);
}

function resetRoulette() {
  clearInterval(countdownInterval);
  rouletteState = { challenge: null, startedAt: null, status: "idle" };
}

function updateChallengePanel(status, challenge, timeLeft) {
  const panel = document.querySelector(".roulette-challenge");
  if (!panel) return;

  if (status === "spinning") {
    panel.className = "roulette-challenge roulette-challenge--spinning";
    panel.innerHTML = `<p class="roulette-challenge__label">Girando...</p>`;
  }
}

// Export for scoring integration - checks if a roulette bonus applies
export function getRouletteBonus(categoryId) {
  try {
    const raw = sessionStorage.getItem("roletabrusca.rouletteBonus");
    if (!raw) return null;
    const bonus = JSON.parse(raw);
    if (bonus.categoryId !== categoryId) return null;
    if (new Date(bonus.expiresAt) < new Date()) {
      sessionStorage.removeItem("roletabrusca.rouletteBonus");
      return null;
    }
    return bonus;
  } catch {
    return null;
  }
}

// Call this after scoring to clear the bonus
export function consumeRouletteBonus() {
  sessionStorage.removeItem("roletabrusca.rouletteBonus");
}
