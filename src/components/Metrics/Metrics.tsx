import React from "react";
import styles from "./Metrics.module.scss";

/**
 * Пропсы для компонента Metrics.
 */
interface MetricsProps {
  isOverlay?: boolean;
  fps: number;
  fpsHistory: number[];
  drawsPerSecond: number;
  drawsPerSecondHistory: number[];
  frameTime: number;
  frameTimeHistory: number[];
  avgRenderTime: number;
  avgRenderTimeHistory: number[];
}

/**
 * Компонент для отображения метрик производительности.
 * Может отображаться в двух режимах: в основной панели или как оверлей.
 * @param {MetricsProps} props - Пропсы компонента.
 * @returns {JSX.Element | null}
 */
export const Metrics: React.FC<MetricsProps> = (props) => {
  const {
    isOverlay,
    fps,
    fpsHistory,
    drawsPerSecond,
    drawsPerSecondHistory,
    frameTime,
    frameTimeHistory,
    avgRenderTime,
    avgRenderTimeHistory,
  } = props;

  const getMetricValueColor = (value: number, thresholds: [number, number]) => {
    if (value > thresholds[0]) return styles.green;
    if (value > thresholds[1]) return styles.yellow;
    return styles.red;
  };

  return (
    <div
      className={`${styles.metricsContainer} ${
        isOverlay ? styles.metricsContainerCollapsed : ""
      }`}
    >
      <div
        className={`${styles.metricsGrid} ${
          isOverlay ? styles.metricsGridCollapsed : ""
        }`}
      >
        <div
          className={`${styles.metricBox} ${
            isOverlay ? styles.metricBoxCollapsed : ""
          }`}
        >
          <div style={{ textAlign: "left" }}>
            <div
              className={`${styles.metricValue} ${
                styles.metricValueLarge
              } ${getMetricValueColor(fps, [50, 30])} ${
                isOverlay ? styles.metricValueCollapsed : ""
              }`}
            >
              {fps}
            </div>
            <div className={styles.metricLabel}>FPS</div>
          </div>
          <div className={styles.history}>
            {fpsHistory.map((val, index) => (
              <span
                key={index}
                className={
                  isOverlay ? styles.historyValueCollapsed : styles.historyValue
                }
              >
                {val}
              </span>
            ))}
          </div>
        </div>
        <div
          className={`${styles.metricBox} ${
            isOverlay ? styles.metricBoxCollapsed : ""
          }`}
        >
          <div style={{ textAlign: "left" }}>
            <div
              className={`${styles.metricValue} ${
                styles.metricValueLarge
              } ${getMetricValueColor(drawsPerSecond, [58, 30])} ${
                isOverlay ? styles.metricValueCollapsed : ""
              }`}
            >
              {drawsPerSecond}
            </div>
            <div className={styles.metricLabel}>Отрисовки / сек</div>
          </div>
          <div className={styles.history}>
            {drawsPerSecondHistory.map((val, index) => (
              <span
                key={index}
                className={
                  isOverlay ? styles.historyValueCollapsed : styles.historyValue
                }
              >
                {val}
              </span>
            ))}
          </div>
        </div>
        <div
          className={`${styles.metricBox} ${
            isOverlay ? styles.metricBoxCollapsed : ""
          }`}
        >
          <div style={{ textAlign: "left" }}>
            <div
              className={`${styles.metricValue} ${getMetricValueColor(
                frameTime,
                [16, 8]
              )} ${isOverlay ? styles.metricValueCollapsed : ""}`}
            >
              {frameTime.toFixed(2)}
            </div>
            <div className={styles.metricLabel}>Время кадра (ms)</div>
          </div>
          <div className={styles.history}>
            {frameTimeHistory.map((time, index) => (
              <span
                key={index}
                className={
                  isOverlay ? styles.historyValueCollapsed : styles.historyValue
                }
              >
                {time.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
        <div
          className={`${styles.metricBox} ${
            isOverlay ? styles.metricBoxCollapsed : ""
          }`}
        >
          <div style={{ textAlign: "left" }}>
            <div
              className={`${styles.metricValue} ${getMetricValueColor(
                avgRenderTime,
                [2, 1]
              )} ${isOverlay ? styles.metricValueCollapsed : ""}`}
            >
              {avgRenderTime.toFixed(2)}
            </div>
            <div className={styles.metricLabel}>Стоимость звезды (µs)</div>
          </div>
          <div className={styles.history}>
            {avgRenderTimeHistory.map((val, index) => (
              <span
                key={index}
                className={
                  isOverlay ? styles.historyValueCollapsed : styles.historyValue
                }
              >
                {val.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
