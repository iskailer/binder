export function getStorageValue(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function setStorageValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // LocalStorage can be unavailable in restricted browser modes.
  }
}

export function removeStorageValue(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // No-op by design.
  }
}
