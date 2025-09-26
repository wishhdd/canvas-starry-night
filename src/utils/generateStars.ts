import { Star } from "../core/Star";
import type { StarType } from "../types/starType";

/**
 * Генерирует массив экземпляров класса Star на основе переданных параметров.
 * @param {Record<StarType, number>} counts - Объект с количеством звезд каждого типа.
 * @param {number} width - Ширина области для генерации.
 * @param {number} height - Высота области для генерации.
 * @param {number} radius - Базовый радиус для каждой звезды.
 * @returns {Star[]} - Массив сгенерированных звезд.
 */
export const generateStars = (
  counts: Record<StarType, number>,
  width: number,
  height: number,
  radius: number
): Star[] => {
  const colors = [
    "#FFFFFF",
    "#87CEEB",
    "#FFA07A",
    "#FFD700",
    "#DA70D6",
    "#00FFFF",
    "#F08080",
    "#ADD8E6",
  ];
  const newStars: Star[] = [];
  let idCounter = 0;
  (Object.keys(counts) as StarType[]).forEach((type) => {
    for (let i = 0; i < counts[type]; i++) {
      newStars.push(
        new Star(
          idCounter++,
          Math.random() * width,
          Math.random() * height,
          radius,
          colors[Math.floor(Math.random() * colors.length)],
          type
        )
      );
    }
  });
  return newStars.sort(() => Math.random() - 0.5);
};
