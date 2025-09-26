/**
 * Определяет триггер для запуска цикла отрисовки.
 * - `raf`: Постоянный цикл `requestAnimationFrame`.
 * - `event`: Отрисовка только по событиям пользователя.
 */
export type AnimationTrigger = "raf" | "event";
