import { slugify } from "../utils/ids.js";

export const AVATARS = Object.freeze([
  {
    id: "bardo-cuscuz",
    name: "Bardo do Cuscuz",
    image: "./assets/avatars/bardo-cuscuz.svg",
    color: "#ffcb05"
  },
  {
    id: "maga-lambe",
    name: "Maga do Lambe-Lambe",
    image: "./assets/avatars/maga-lambe.svg",
    color: "#ff4d8d"
  },
  {
    id: "tanque-guarana",
    name: "Tanque de Guarana",
    image: "./assets/avatars/tanque-guarana.svg",
    color: "#24d17e"
  },
  {
    id: "ninja-coxinha",
    name: "Ninja da Coxinha",
    image: "./assets/avatars/ninja-coxinha.svg",
    color: "#38bdf8"
  }
]);

export function pickAvatarType(name) {
  const seed = slugify(name);
  const total = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATARS[total % AVATARS.length].id;
}

export function getAvatar(avatarType) {
  return AVATARS.find((avatar) => avatar.id === avatarType) || AVATARS[0];
}
