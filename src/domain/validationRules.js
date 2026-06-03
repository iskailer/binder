import { APP_CONFIG } from "../config/appConfig.js";
import { VALIDATION_STATUS } from "../utils/constants.js";
import { isPastIso, nowIso } from "../utils/time.js";

export function normalizeCode(code) {
  return String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isCodeExpired(validationCode, referenceIso = nowIso()) {
  return !validationCode?.expiresAt || isPastIso(validationCode.expiresAt, referenceIso);
}

export function assertCanGenerateCode(validationCode, validatorPlayerId, distanceMeters) {
  if (!validationCode) {
    throw new Error("Pedido de validacao nao encontrado.");
  }

  if (validationCode.status !== VALIDATION_STATUS.REQUESTED) {
    throw new Error("Esse pedido ja virou codigo ou foi encerrado.");
  }

  if (validationCode.targetPlayerId === validatorPlayerId) {
    throw new Error("Autovalidacao nao da XP. Chame outra pessoa.");
  }

  if (distanceMeters == null || distanceMeters > APP_CONFIG.proximityMeters) {
    throw new Error(`Jogadores fora do raio de ${APP_CONFIG.proximityMeters} metros.`);
  }
}

export function assertCanUseCode(validationCode, targetPlayerId, referenceIso = nowIso()) {
  if (!validationCode) {
    throw new Error("Codigo nao encontrado.");
  }

  if (validationCode.status !== VALIDATION_STATUS.ACTIVE) {
    throw new Error("Codigo indisponivel ou ja usado.");
  }

  if (validationCode.targetPlayerId !== targetPlayerId) {
    throw new Error("Esse codigo pertence a outro jogador.");
  }

  if (validationCode.usedAt) {
    throw new Error("Codigo ja utilizado.");
  }

  if (isCodeExpired(validationCode, referenceIso)) {
    throw new Error("Codigo expirou. Gera outro rapidinho.");
  }
}
