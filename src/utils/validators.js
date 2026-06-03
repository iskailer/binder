export function requiredText(value, label = "campo") {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(`Preencha ${label}.`);
  }
  return text;
}

export function maxLength(value, max, label = "campo") {
  const text = String(value || "").trim();
  if (text.length > max) {
    throw new Error(`${label} pode ter no máximo ${max} caracteres.`);
  }
  return text;
}

export function assertDifferentPlayers(targetPlayerId, validatorPlayerId) {
  if (!targetPlayerId || !validatorPlayerId || targetPlayerId === validatorPlayerId) {
    throw new Error("A validação precisa vir de outro jogador do rolê.");
  }
}
