export async function registerPwa() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    return await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.warn("Service worker nao registrado", error);
    return null;
  }
}

export function observeNetworkStatus(callback) {
  const notify = () => callback({ isOnline: navigator.onLine });
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  notify();

  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}
