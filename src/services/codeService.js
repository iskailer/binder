import * as achievementRepository from "../data/achievementRepository.js";
import * as categoryRepository from "../data/categoryRepository.js";
import * as eventRepository from "../data/eventRepository.js";
import * as playerRepository from "../data/playerRepository.js";
import * as scoreRepository from "../data/scoreRepository.js";
import * as validationRepository from "../data/validationRepository.js";
import { APP_CONFIG } from "../config/appConfig.js";
import { getNewAchievements } from "../domain/achievementRules.js";
import { assertEventCanReceiveScore } from "../domain/eventRules.js";
import { calculateLevel, getTitlesForLevel } from "../domain/levelRules.js";
import { getCategoryPoints, getSidekickPoints, getXpFromScores } from "../domain/scoreRules.js";
import { assertCanGenerateCode, assertCanUseCode, isCodeExpired, normalizeCode } from "../domain/validationRules.js";
import { getDistanceMeters, getCurrentPosition } from "./geoService.js";
import { syncScoreToFirestore } from "./firebaseService.js";
import { createId, getRandomToken } from "../utils/ids.js";
import { SCORE_TYPES, VALIDATION_STATUS } from "../utils/constants.js";
import { addSecondsIso, nowIso } from "../utils/time.js";

export async function createValidationRequest({ eventId, categoryId, targetPlayerId }) {
  const [event, category, targetPlayer] = await Promise.all([
    eventRepository.getEventById(eventId),
    categoryRepository.getCategoryById(categoryId),
    playerRepository.getPlayerById(targetPlayerId)
  ]);

  assertEventCanReceiveScore(event);
  if (!category?.active) throw new Error("Categoria indisponivel.");
  if (!targetPlayer) throw new Error("Jogador nao encontrado.");

  const targetLocation = await getCurrentPosition();
  const createdAt = nowIso();
  const validationCode = {
    id: createId("validation"),
    code: "",
    eventId,
    categoryId,
    generatedByPlayerId: null,
    targetPlayerId,
    createdAt,
    requestedAt: createdAt,
    expiresAt: null,
    usedAt: null,
    status: VALIDATION_STATUS.REQUESTED,
    targetLocation,
    validatorLocation: null,
    metadata: {
      categoryName: category.name
    }
  };

  return validationRepository.createValidationCode(validationCode);
}

export async function generateValidationCode({ requestId, validatorPlayerId }) {
  const validationCode = await validationRepository.getValidationCodeById(requestId);
  const event = await eventRepository.getEventById(validationCode?.eventId);
  assertEventCanReceiveScore(event);

  const validator = await playerRepository.getPlayerById(validatorPlayerId);
  if (!validator) throw new Error("Validador nao encontrado.");

  const validatorLocation = await getCurrentPosition();
  const distanceMeters = getDistanceMeters(validationCode.targetLocation, validatorLocation);
  assertCanGenerateCode(validationCode, validatorPlayerId, distanceMeters);

  const createdAt = nowIso();
  const code = await createUniqueActiveCode();
  const updatedCode = {
    ...validationCode,
    code,
    generatedByPlayerId: validatorPlayerId,
    createdAt,
    expiresAt: addSecondsIso(createdAt, APP_CONFIG.codeTtlSeconds),
    status: VALIDATION_STATUS.ACTIVE,
    validatorLocation,
    metadata: {
      ...(validationCode.metadata || {}),
      distanceMeters
    }
  };

  return validationRepository.updateValidationCode(updatedCode);
}

async function createUniqueActiveCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = getRandomToken(5);
    const existing = await validationRepository.findActiveCode(code);
    if (!existing) return code;
  }

  throw new Error("Nao consegui gerar um codigo unico agora. Tente novamente.");
}

export async function validateCodeAndScore({ rawCode, targetPlayerId }) {
  const code = normalizeCode(rawCode);
  await expireStaleCodes();

  const validationCode = await validationRepository.findActiveCode(code);
  assertCanUseCode(validationCode, targetPlayerId);

  const [event, category] = await Promise.all([
    eventRepository.getEventById(validationCode.eventId),
    categoryRepository.getCategoryById(validationCode.categoryId)
  ]);

  assertEventCanReceiveScore(event);

  const duplicate = await scoreRepository.hasScoreForValidation(validationCode.id);
  if (duplicate) {
    await validationRepository.updateValidationCode({
      ...validationCode,
      status: VALIDATION_STATUS.USED,
      usedAt: validationCode.usedAt || nowIso()
    });
    throw new Error("Esse codigo ja gerou pontuacao.");
  }

  const createdAt = nowIso();
  const actionPoints = getCategoryPoints(category);
  const sidekickPoints = getSidekickPoints(actionPoints);

  const actionScore = await scoreRepository.addScoreEntry({
    id: createId("score"),
    playerId: targetPlayerId,
    eventId: validationCode.eventId,
    categoryId: validationCode.categoryId,
    points: actionPoints,
    type: SCORE_TYPES.ACTION,
    validatedBy: validationCode.generatedByPlayerId,
    createdAt,
    metadata: {
      validationCodeId: validationCode.id,
      categoryName: category.name
    }
  });

  const sidekickScore = await scoreRepository.addScoreEntry({
    id: createId("score"),
    playerId: validationCode.generatedByPlayerId,
    eventId: validationCode.eventId,
    categoryId: validationCode.categoryId,
    points: sidekickPoints,
    type: SCORE_TYPES.SIDEKICK,
    validatedBy: validationCode.generatedByPlayerId,
    createdAt,
    metadata: {
      validationCodeId: validationCode.id,
      targetPlayerId,
      categoryName: category.name
    }
  });

  await validationRepository.updateValidationCode({
    ...validationCode,
    status: VALIDATION_STATUS.USED,
    usedAt: createdAt
  });

  syncScoreToFirestore(actionScore);
  syncScoreToFirestore(sidekickScore);

  const [targetProgress, sidekickProgress] = await Promise.all([
    applyProgress(targetPlayerId),
    applyProgress(validationCode.generatedByPlayerId)
  ]);

  return {
    actionScore,
    sidekickScore,
    category,
    targetProgress,
    sidekickProgress
  };
}

export async function expireStaleCodes(eventId = null) {
  const codes = eventId
    ? await validationRepository.listValidationCodesByEvent(eventId)
    : await validationRepository.listValidationCodes();

  const expired = codes.filter((code) => code.status === VALIDATION_STATUS.ACTIVE && isCodeExpired(code));
  await Promise.all(
    expired.map((code) =>
      validationRepository.updateValidationCode({
        ...code,
        status: VALIDATION_STATUS.EXPIRED
      })
    )
  );

  return expired;
}

export async function applyProgress(playerId) {
  const [player, scores, existingAchievements] = await Promise.all([
    playerRepository.getPlayerById(playerId),
    scoreRepository.listScoreEntriesByPlayer(playerId),
    achievementRepository.listAchievementsByPlayer(playerId)
  ]);

  if (!player) return null;

  const xp = getXpFromScores(scores);
  const level = calculateLevel(xp);
  const titles = getTitlesForLevel(level);
  const updatedPlayer = await playerRepository.updatePlayer({
    ...player,
    xp,
    level,
    titles
  });

  const newAchievements = getNewAchievements(updatedPlayer, scores, existingAchievements);
  const unlocked = [];
  for (const achievement of newAchievements) {
    unlocked.push(await achievementRepository.unlockAchievement({ playerId, ...achievement }));
  }

  return {
    player: updatedPlayer,
    unlocked
  };
}
