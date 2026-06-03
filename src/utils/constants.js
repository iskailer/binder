export const DOC_TYPES = Object.freeze({
  PLAYER: "player",
  EVENT: "event",
  CATEGORY: "category",
  VALIDATION_CODE: "validationCode",
  SCORE_ENTRY: "scoreEntry",
  ACHIEVEMENT: "achievement"
});

export const EVENT_STATUS = Object.freeze({
  OPEN: "open",
  CLOSED: "closed"
});

export const VALIDATION_STATUS = Object.freeze({
  REQUESTED: "requested",
  ACTIVE: "active",
  USED: "used",
  EXPIRED: "expired",
  CANCELLED: "cancelled"
});

export const SCORE_TYPES = Object.freeze({
  ACTION: "action",
  SIDEKICK: "sidekick"
});

export const STORAGE_KEYS = Object.freeze({
  ACTIVE_PLAYER_ID: "roletabrusca.activePlayerId",
  ACTIVE_EVENT_ID: "roletabrusca.activeEventId",
  SELECTED_CATEGORY_ID: "roletabrusca.selectedCategoryId",
  FIREBASE_UID: "roletabrusca.firebaseUid"
});

export const ROUTES = Object.freeze({
  AUTH: "#/auth",
  HOME: "#/home",
  PLAYERS: "#/players",
  EVENT: "#/event",
  CATEGORIES: "#/categories",
  PLAY: "#/jogar",
  ROULETTE: "#/roleta",
  VALIDATION: "#/validation",
  RANKING: "#/ranking",
  PROFILE: "#/profile",
  ACHIEVEMENTS: "#/achievements",
  ADMIN: "#/admin"
});
