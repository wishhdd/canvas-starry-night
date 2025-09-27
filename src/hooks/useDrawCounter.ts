import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Кастомный хук для подсчета количества вызовов отрисовки в секунду.
 * @returns {{ drawsPerSecond: number, increment: () => void }} - Объект с текущим количеством отрисовок и функцией для его инкремента.
 */
export const useDrawCounter = (): {
  drawsPerSecond: number;
  increment: () => void;
} => {
  const [drawsPerSecond, setDrawsPerSecond] = useState(0);
  const drawCount = useRef(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDrawsPerSecond(drawCount.current);
      drawCount.current = 0;
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const increment = useCallback(() => {
    drawCount.current++;
  }, []);

  return { drawsPerSecond, increment };
};
