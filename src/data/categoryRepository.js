import { DOC_TYPES } from "../utils/constants.js";
import { listEntities, getEntity, saveEntity, removeEntity } from "./db.js";

export const FIXED_CATEGORIES = Object.freeze([
  {
    id: "fazer-alguem-rir",
    name: "Fazer alguem rir",
    description: "Risada audivel, sem suborno emocional.",
    points: 8,
    validationMode: "peer_geo_code"
  },
  {
    id: "executar-zoeira",
    name: "Executar uma zoeira",
    description: "Zoeira consentida, registrada nos anais do role.",
    points: 12,
    validationMode: "peer_geo_code"
  },
  {
    id: "dancar-centro-roda",
    name: "Dancar no centro da roda por 10 segundos",
    description: "A pista reconheceu a coragem.",
    points: 15,
    validationMode: "peer_geo_code"
  },
  {
    id: "foto-em-grupo",
    name: "Conseguir uma foto em grupo",
    description: "Todo mundo apareceu, ate quem piscou.",
    points: 10,
    validationMode: "peer_geo_code"
  },
  {
    id: "defender-amigo-estilo",
    name: "Defender um amigo com estilo",
    description: "Diplomacia, postura e uma frase de efeito.",
    points: 14,
    validationMode: "peer_geo_code"
  },
  {
    id: "beijar",
    name: "Beijar",
    description: "Consentimento, carisma e pontuacao oficial.",
    points: 20,
    validationMode: "peer_geo_code"
  },
  {
    id: "ajudar-desafio",
    name: "Ajudar alguem a cumprir um desafio",
    description: "Sidekick raiz tambem entra no placar.",
    points: 8,
    validationMode: "peer_geo_code"
  },
  {
    id: "mesa-toda-rir",
    name: "Fazer a mesa toda rir",
    description: "Efeito area desbloqueado.",
    points: 18,
    validationMode: "peer_geo_code"
  },
  {
    id: "vencer-curiosidades",
    name: "Vencer uma disputa de curiosidades",
    description: "Sabedoria inutil, impacto real.",
    points: 12,
    validationMode: "peer_geo_code"
  },
  {
    id: "levar-fora",
    name: "Levar um fora",
    description: "Derrota social, vitoria de narrativa.",
    points: 9,
    validationMode: "peer_geo_code"
  },
  {
    id: "tomar-refrigerante",
    name: "Tomar um refrigerante",
    description: "A hidratacao canonica do campeao.",
    points: 6,
    validationMode: "peer_geo_code"
  }
]);

export async function seedFixedCategories() {
  const createdAt = "2026-01-01T00:00:00.000Z";
  await Promise.all(
    FIXED_CATEGORIES.map((category) =>
      saveEntity(DOC_TYPES.CATEGORY, {
        ...category,
        fixed: true,
        active: true,
        createdAt
      })
    )
  );
}

export async function listCategories() {
  const categories = await listEntities(DOC_TYPES.CATEGORY);
  return categories.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function listActiveCategories() {
  const categories = await listCategories();
  return categories.filter((category) => category.active);
}

export async function getCategoryById(categoryId) {
  return getEntity(DOC_TYPES.CATEGORY, categoryId);
}

export async function createCategory({ id, name, description, points }) {
  const category = {
    id,
    name,
    description: description || "",
    points: Number(points) || 10,
    validationMode: "peer_geo_code",
    fixed: false,
    active: true,
    createdAt: new Date().toISOString()
  };
  return saveEntity(DOC_TYPES.CATEGORY, category);
}

export async function updateCategory(category) {
  return saveEntity(DOC_TYPES.CATEGORY, category);
}

export async function deleteCategory(categoryId) {
  return removeEntity(DOC_TYPES.CATEGORY, categoryId);
}

export async function toggleCategoryActive(categoryId) {
  const category = await getCategoryById(categoryId);
  if (!category) return null;
  return saveEntity(DOC_TYPES.CATEGORY, { ...category, active: !category.active });
}
