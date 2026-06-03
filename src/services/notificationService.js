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

export function showCodeToast(code, extraMessage = "") {
  const region = document.getElementById("toast-region");
  if (!region) return;

  const toast = document.createElement("div");
  toast.className = "toast toast--code";
  toast.setAttribute("role", "status");

  const codeSpan = document.createElement("span");
  codeSpan.className = "toast-code__value";
  codeSpan.textContent = code;

  const copyBtn = document.createElement("button");
  copyBtn.className = "toast-code__copy";
  copyBtn.textContent = "Copiar";
  copyBtn.type = "button";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard?.writeText(code).then(() => {
      copyBtn.textContent = "Copiado!";
      setTimeout(() => { copyBtn.textContent = "Copiar"; }, 1200);
    }).catch(() => {
      // Fallback: select the text
      const range = document.createRange();
      range.selectNode(codeSpan);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    });
  });

  const msgSpan = document.createElement("span");
  msgSpan.className = "toast-code__msg";
  msgSpan.textContent = extraMessage;

  const row = document.createElement("div");
  row.className = "toast-code__row";
  row.appendChild(codeSpan);
  row.appendChild(copyBtn);

  toast.appendChild(row);
  if (extraMessage) toast.appendChild(msgSpan);

  region.appendChild(toast);

  // Code toasts stay visible for 12 seconds
  setTimeout(() => {
    toast.classList.add("toast--leaving");
    setTimeout(() => toast.remove(), 220);
  }, 12000);
}

export function showEpicToast(message) {
  const region = document.getElementById("toast-region");
  if (!region) return;

  const toast = document.createElement("div");
  toast.className = "toast toast--epic";
  toast.setAttribute("role", "alert");
  toast.textContent = message;
  region.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast--leaving");
    setTimeout(() => toast.remove(), 220);
  }, 5000);
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
