export function createId(prefix = "id") {
  const time = Date.now().toString(36);
  const random = getRandomToken(8).toLowerCase();
  return `${prefix}_${time}_${random}`;
}

export function getRandomToken(size = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const cryptoApi = globalThis.crypto;
  const bytes = new Uint8Array(size);

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  }

  return Array.from({ length: size }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
