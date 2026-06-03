import { ROUTES } from "../utils/constants.js";

export function showToast(message, variant = "success") {
  const region = document.getElementById("toast-region");
  if (!region) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${variant}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  region.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast--leaving");
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

export function showToastAndRedirect(message, variant = "success", navigateFn = null) {
  showToast(message, variant);
  setTimeout(() => {
    if (navigateFn) {
      navigateFn(ROUTES.HOME);
    } else if (location.hash !== ROUTES.HOME) {
      location.hash = ROUTES.HOME;
    }
  }, 1200);
}
