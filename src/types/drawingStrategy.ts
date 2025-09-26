/**
 * Определяет стратегию отрисовки.
 * - `naive`: Отрисовка "в лоб" на каждом кадре.
 * - `path2d`: Использование кешированных объектов Path2D.
 * - `optimized`: Использование техник кеширования (offscreen canvas).
 */
export type DrawingStrategy = "naive" | "path2d" | "optimized";
