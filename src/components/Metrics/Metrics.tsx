import { useEffect, useState } from "react";
import { CanvasRendererEngine } from "../../core/CanvasRendererEngine";
import { useDrawCounter } from "../../hooks/useDrawCounter";
import { useFps } from "../../hooks/useFps";
import styles from "./Metrics.module.scss";

interface MetricsProps {
  engine: CanvasRendererEngine | null;
}

export function Metrics({ engine }: MetricsProps) {
  const fps = useFps();
  const { drawsPerSecond, increment } = useDrawCounter();
  const [engineMetrics, setEngineMetrics] = useState({
    frameTime: 0,
    avgRenderTime: 0,
  });

  // Подключаем движок к хуку отрисовок
  useEffect(() => {
    if (!engine) return;

    // Устанавливаем callback для увеличения счетчика
    engine.onDraw = increment;

    // Подписываемся на обновления метрик движка
    const originalOnStateChange = engine.onStateChange;
    engine.onStateChange = () => {
      originalOnStateChange?.();
      setEngineMetrics({
        frameTime: engine.frameTime,
        avgRenderTime: engine.avgRenderTime,
      });
    };

    return () => {
      engine.onDraw = null;
      engine.onStateChange = originalOnStateChange;
    };
  }, [engine, increment]);

  if (!engine) {
    return null;
  }

  return (
    <div className={styles.metricsContainer}>
      <div className={styles.metricsGrid}>
        {/* FPS из хука */}
        <div className={styles.metricBox}>
          <div className={styles.metricMain}>
            <div
              className={styles.metricValue}
              style={{
                color: fps > 50 ? "#4ade80" : fps > 30 ? "#facc15" : "#f87171",
              }}
            >
              {fps}
            </div>
            <div className={styles.metricLabel}>FPS (хук)</div>
          </div>
        </div>

        {/* Отрисовки/сек из хука */}
        <div className={styles.metricBox}>
          <div className={styles.metricMain}>
            <div
              className={styles.metricValue}
              style={{
                color:
                  drawsPerSecond > 58
                    ? "#4ade80"
                    : drawsPerSecond > 30
                    ? "#facc15"
                    : "#f87171",
              }}
            >
              {drawsPerSecond}
            </div>
            <div className={styles.metricLabel}>Отрисовки/сек (хук)</div>
          </div>
        </div>

        {/* Время кадра из движка */}
        <div className={styles.metricBox}>
          <div className={styles.metricMain}>
            <div
              className={styles.metricValue}
              style={{
                color:
                  engineMetrics.frameTime < 8
                    ? "#4ade80"
                    : engineMetrics.frameTime < 16
                    ? "#facc15"
                    : "#f87171",
              }}
            >
              {engineMetrics.frameTime.toFixed(2)}
            </div>
            <div className={styles.metricLabel}>Время кадра (ms)</div>
          </div>
        </div>

        {/* Стоимость звезды из движка */}
        <div className={styles.metricBox}>
          <div className={styles.metricMain}>
            <div
              className={styles.metricValue}
              style={{
                color:
                  engineMetrics.avgRenderTime < 1
                    ? "#4ade80"
                    : engineMetrics.avgRenderTime < 2
                    ? "#facc15"
                    : "#f87171",
              }}
            >
              {engineMetrics.avgRenderTime.toFixed(2)}
            </div>
            <div className={styles.metricLabel}>Стоимость звезды (µs)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
