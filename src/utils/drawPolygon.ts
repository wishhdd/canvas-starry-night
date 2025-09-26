/**
 * Рисует многоугольник на 2D-контексте canvas или объекте Path2D.
 * @param {CanvasRenderingContext2D | Path2D} target - Цель для рисования.
 * @param {number} x - X-координата центра.
 * @param {number} y - Y-координата центра.
 * @param {number} radius - Радиус описанной окружности.
 * @param {number} sides - Количество сторон (вершин).
 */
export const drawPolygon = (
  target: CanvasRenderingContext2D | Path2D,
  x: number,
  y: number,
  radius: number,
  sides: number
) => {
  if (sides < 3) return;
  if (target instanceof CanvasRenderingContext2D) {
    target.beginPath();
  }
  target.moveTo(x + radius * Math.cos(0), y + radius * Math.sin(0));
  for (let i = 1; i <= sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    target.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
  }
};
