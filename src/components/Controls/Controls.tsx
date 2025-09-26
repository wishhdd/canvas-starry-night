import React, { useState } from "react";
import type { AnimationTrigger } from "../../types/animationTrigger";
import type { DrawingStrategy } from "../../types/drawingStrategy";
import type { StarType } from "../../types/starType";
import styles from "./Controls.module.scss";

/**
 * Пропсы для компонента Controls.
 */
interface ControlsProps {
  isHeaderCollapsed: boolean;
  setIsHeaderCollapsed: (isCollapsed: boolean) => void;
  totalStars: number;
  committedFinalRadius: number;
  drawingStrategy: DrawingStrategy;
  animationTrigger: AnimationTrigger;
  showCometTrail: boolean;
  forceUniqueSprites: boolean;
  liveStarCounts: Record<StarType, number>;
  liveStarRadius: number;
  liveMultipliers: { m1: boolean; m2: boolean };
  onCommitSettings: () => void;
  setDrawingStrategy: (strategy: DrawingStrategy) => void;
  setAnimationTrigger: (trigger: AnimationTrigger) => void;
  setShowCometTrail: (show: boolean) => void;
  setForceUniqueSprites: (force: boolean) => void;
  setLiveStarCounts: React.Dispatch<
    React.SetStateAction<Record<StarType, number>>
  >;
  setLiveStarRadius: (radius: number) => void;
  setLiveMultipliers: React.Dispatch<
    React.SetStateAction<{ m1: boolean; m2: boolean }>
  >;
}

/**
 * Компонент, содержащий все элементы управления песочницей.
 * @param {ControlsProps} props - Пропсы компонента.
 * @returns {JSX.Element}
 */
export const Controls: React.FC<ControlsProps> = (props) => {
  const {
    isHeaderCollapsed,
    setIsHeaderCollapsed,
    totalStars,
    committedFinalRadius,
    drawingStrategy,
    animationTrigger,
    showCometTrail,
    forceUniqueSprites,
    liveStarCounts,
    liveStarRadius,
    liveMultipliers,
    onCommitSettings,
    setDrawingStrategy,
    setAnimationTrigger,
    setShowCometTrail,
    setForceUniqueSprites,
    setLiveStarCounts,
    setLiveStarRadius,
    setLiveMultipliers,
  } = props;

  const [showMemoryTooltip, setShowMemoryTooltip] = useState(false);
  const liveFinalRadius =
    liveStarRadius *
    (liveMultipliers.m1 ? 10 : 1) *
    (liveMultipliers.m2 ? 10 : 1);

  const handleCountChange = (type: StarType, count: number) =>
    setLiveStarCounts((prev) => ({ ...prev, [type]: count }));
  const handleRadiusChange = (radius: number) => setLiveStarRadius(radius);
  const handleMultiplierChange = (multiplier: "m1" | "m2", value: boolean) =>
    setLiveMultipliers((prev) => ({ ...prev, [multiplier]: value }));

  const getButtonClassName = (strategy: DrawingStrategy | AnimationTrigger) => {
    if (strategy === drawingStrategy || strategy === animationTrigger) {
      if (strategy === "naive") return styles.activeNaive;
      if (strategy === "path2d") return styles.activePath2D;
      if (strategy === "optimized") return styles.activeOptimized;
      if (strategy === "raf") return styles.activeRaf;
      if (strategy === "event") return styles.activeEvent;
    }
    return "";
  };

  return (
    <>
      <div className={isHeaderCollapsed ? styles.collapsedHeaderContent : ""}>
        <h1 className={isHeaderCollapsed ? styles.hidden : styles.h1}>
          Песочница Оптимизации Canvas
        </h1>
        {isHeaderCollapsed && (
          <div className={styles.collapsedHeaderContent}>
            <span className={styles.collapsedInfoItem}>✨ {totalStars}</span>
            <span className={styles.collapsedInfoItem}>
              📏 {committedFinalRadius}px
            </span>
            <span className={styles.collapsedInfoItem}>
              {drawingStrategy === "optimized"
                ? "🚀 Опт."
                : drawingStrategy === "path2d"
                ? "📐 Path2D"
                : "🐢 Наив."}
            </span>
            <span className={styles.collapsedInfoItem}>
              {animationTrigger === "raf" ? " rAF " : " Событие "}
            </span>
            <span className={styles.collapsedInfoItem}>
              🌠 {showCometTrail ? "Вкл" : "Выкл"}
            </span>
            <span className={styles.collapsedInfoItem}>
              🔥 {forceUniqueSprites ? "Вкл" : "Выкл"}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
        className={styles.toggleButton}
      >
        {isHeaderCollapsed ? "⤓" : "⤒"}
      </button>
      <div className={styles.controlsGrid}>
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            gap: "1.5rem",
          }}
        >
          <div
            className={styles.settingsPanel}
            onMouseUp={onCommitSettings}
            onTouchEnd={onCommitSettings}
          >
            <h2 className={styles.settingsH2}>
              Настройки звезд (
              {Object.values(liveStarCounts).reduce((s, c) => s + c, 0)})
            </h2>
            <div className={styles.sliderGroup}>
              <label htmlFor="starRadius" className={styles.sliderLabel}>
                Размер: {liveStarRadius} (Итог: {liveFinalRadius})
              </label>
              <div className={styles.sliderControl}>
                <input
                  type="range"
                  id="starRadius"
                  min="1"
                  max="10"
                  step="1"
                  value={liveStarRadius}
                  onChange={(e) => handleRadiusChange(+e.target.value)}
                />
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="mult1"
                    checked={liveMultipliers.m1}
                    onChange={(e) =>
                      handleMultiplierChange("m1", e.target.checked)
                    }
                  />
                  <label htmlFor="mult1" className={styles.sliderLabel}>
                    x10
                  </label>
                </div>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="mult2"
                    checked={liveMultipliers.m2}
                    onChange={(e) =>
                      handleMultiplierChange("m2", e.target.checked)
                    }
                  />
                  <label htmlFor="mult2" className={styles.sliderLabel}>
                    x10
                  </label>
                </div>
              </div>
            </div>
            <hr className={styles.hr} />
            <div className={styles.sliderGroup}>
              <label htmlFor="circleCount" className={styles.sliderLabel}>
                Круги: {liveStarCounts.circle}
              </label>
              <input
                type="range"
                id="circleCount"
                min="0"
                max="20000"
                step="500"
                value={liveStarCounts.circle}
                onChange={(e) => handleCountChange("circle", +e.target.value)}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label htmlFor="triangleCount" className={styles.sliderLabel}>
                Треугольники: {liveStarCounts.triangle}
              </label>
              <input
                type="range"
                id="triangleCount"
                min="0"
                max="10000"
                step="500"
                value={liveStarCounts.triangle}
                onChange={(e) => handleCountChange("triangle", +e.target.value)}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label htmlFor="squareCount" className={styles.sliderLabel}>
                Квадраты: {liveStarCounts.square}
              </label>
              <input
                type="range"
                id="squareCount"
                min="0"
                max="10000"
                step="500"
                value={liveStarCounts.square}
                onChange={(e) => handleCountChange("square", +e.target.value)}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label htmlFor="pentagonCount" className={styles.sliderLabel}>
                Пятиугольники: {liveStarCounts.pentagon}
              </label>
              <input
                type="range"
                id="pentagonCount"
                min="0"
                max="10000"
                step="500"
                value={liveStarCounts.pentagon}
                onChange={(e) => handleCountChange("pentagon", +e.target.value)}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label htmlFor="hexagonCount" className={styles.sliderLabel}>
                Шестиугольники: {liveStarCounts.hexagon}
              </label>
              <input
                type="range"
                id="hexagonCount"
                min="0"
                max="10000"
                step="500"
                value={liveStarCounts.hexagon}
                onChange={(e) => handleCountChange("hexagon", +e.target.value)}
              />
            </div>
          </div>

          <div className={styles.buttonsContainer}>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => setDrawingStrategy("naive")}
                className={`${styles.button} ${getButtonClassName("naive")}`}
              >
                Наивная
              </button>
              <button
                onClick={() => setDrawingStrategy("path2d")}
                className={`${styles.button} ${getButtonClassName("path2d")}`}
              >
                Path2D
              </button>
              <button
                onClick={() => setDrawingStrategy("optimized")}
                className={`${styles.button} ${getButtonClassName(
                  "optimized"
                )}`}
              >
                Оптимизированная
              </button>
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => setAnimationTrigger("raf")}
                className={`${styles.button} ${getButtonClassName("raf")}`}
              >
                Триггер: rAF
              </button>
              <button
                onClick={() => setAnimationTrigger("event")}
                className={`${styles.button} ${getButtonClassName("event")}`}
              >
                Триггер: Событие
              </button>
            </div>
            <div className={styles.optionsPanel}>
              <input
                type="checkbox"
                id="showComet"
                checked={showCometTrail}
                onChange={(e) => setShowCometTrail(e.target.checked)}
              />
              <label
                htmlFor="showComet"
                className={styles.checkboxLabelSecondary}
              >
                Показать след кометы
              </label>
            </div>
            <div
              className={styles.optionsPanel}
              onMouseEnter={() => setShowMemoryTooltip(true)}
              onMouseLeave={() => setShowMemoryTooltip(false)}
            >
              <input
                type="checkbox"
                id="forceUniqueSprites"
                checked={forceUniqueSprites}
                onChange={(e) => setForceUniqueSprites(e.target.checked)}
              />
              <label
                htmlFor="forceUniqueSprites"
                className={styles.checkboxLabel}
              >
                Перегрузить память
              </label>
              {showMemoryTooltip && (
                <div className={styles.tooltip}>
                  Эта опция заставляет создавать и хранить в памяти уникальный
                  холст для КАЖДОЙ звезды. Смотрите реальное потребление в
                  Диспетчере задач Chrome (Shift+Esc).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
