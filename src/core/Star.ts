import type { StarType } from "../types/starType";

/**
 * Класс, представляющий отдельную звезду.
 * Инкапсулирует все данные, относящиеся к одной звезде.
 */
export class Star {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  type: StarType;

  /**
   * @param {number} id - Уникальный идентификатор.
   * @param {number} x - Начальная X-координата.
   * @param {number} y - Начальная Y-координата.
   * @param {number} radius - Базовый радиус.
   * @param {string} color - Цвет звезды в формате CSS.
   * @param {StarType} type - Тип (форма) звезды.
   */
  constructor(
    id: number,
    x: number,
    y: number,
    radius: number,
    color: string,
    type: StarType
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.type = type;
  }
}
