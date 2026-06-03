import { DOC_TYPES, VALIDATION_STATUS } from "../utils/constants.js";
import { normalizeCode } from "../domain/validationRules.js";
import { listEntities, getEntity, saveEntity } from "./db.js";

export async function createValidationCode(validationCode) {
  return saveEntity(DOC_TYPES.VALIDATION_CODE, validationCode);
}

export async function updateValidationCode(validationCode) {
  return saveEntity(DOC_TYPES.VALIDATION_CODE, validationCode);
}

export async function getValidationCodeById(validationCodeId) {
  return getEntity(DOC_TYPES.VALIDATION_CODE, validationCodeId);
}

export async function listValidationCodes() {
  const codes = await listEntities(DOC_TYPES.VALIDATION_CODE);
  return codes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function listValidationCodesByEvent(eventId) {
  const codes = await listValidationCodes();
  return codes.filter((code) => code.eventId === eventId);
}

export async function findActiveCode(rawCode) {
  const code = normalizeCode(rawCode);
  const codes = await listValidationCodes();
  return codes.find((entry) => entry.code === code && entry.status === VALIDATION_STATUS.ACTIVE) || null;
}
