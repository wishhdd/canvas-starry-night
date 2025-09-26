/**
 * Определяет стратегию отрисовки.
 * - `naive`: Отрисовка "в лоб" на каждом кадре.
 * - `optimized`: Использование техник кеширования.
 */
export type DrawingStrategy = "naive" | "optimized";
