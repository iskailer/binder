export function loadingState(message = "Carregando a Roleta Brusca...") {
  return `
    <section class="loading-state" aria-live="polite">
      <span class="loader"></span>
      <p>${message}</p>
    </section>
  `;
}
