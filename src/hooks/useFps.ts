import { useEffect, useRef, useState } from "react";

/**
 * Кастомный хук для измерения и отображения FPS (кадров в секунду).
 * @returns {number} - Текущее значение FPS.
 */
export const useFps = (): number => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let id: number;
    const measure = () => {
      const now = performance.now();
      frameCount.current++;
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }
      id = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(id);
  }, []);

  return fps;
};
