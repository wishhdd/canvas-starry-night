/**
 * Рисует многоугольник на 2D-контексте canvas.
 * @param {CanvasRenderingContext2D} ctx - Контекст для рисования.
 * @param {number} x - X-координата центра.
 * @param {number} y - Y-координата центра.
 * @param {number} radius - Радиус описанной окружности.
 * @param {number} sides - Количество сторон (вершин).
 */
export const drawPolygon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number
) => {
  if (sides < 3) return;
  ctx.beginPath();
  ctx.moveTo(x + radius * Math.cos(0), y + radius * Math.sin(0));
  for (let i = 1; i <= sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
  }
};
