import { ROUTES, STORAGE_KEYS } from "../../utils/constants.js";
import { setStorageValue } from "../../utils/storage.js";
import { showToast } from "../../services/notificationService.js";
import { categoryView } from "./categoryView.js";

export async function render(context) {
  return categoryView({
    categories: context.categories,
    event: context.event
  });
}

export function bind(context) {
  document.querySelectorAll("[data-request-category]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!context.event) {
        showToast("Inicie um evento antes de pontuar.", "error");
        return;
      }

      setStorageValue(STORAGE_KEYS.SELECTED_CATEGORY_ID, button.dataset.requestCategory);
      context.navigate(ROUTES.PLAY);
    });
  });
}
