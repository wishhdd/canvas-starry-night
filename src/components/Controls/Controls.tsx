import { useEffect, useState } from "react";
import { CanvasRendererEngine } from "../../core/CanvasRendererEngine";
import type { AnimationTrigger } from "../../types/animationTrigger";
import type { DrawingStrategy } from "../../types/drawingStrategy";
import type { StarType } from "../../types/starType";
import styles from "./Controls.module.scss";

interface ControlsProps {
  engine: CanvasRendererEngine | null;
}

/**
 * Компонент, содержащий все элементы управления песочницей.
 */
export function Controls({ engine }: ControlsProps) {
  const [showMemoryTooltip, setShowMemoryTooltip] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [, setRevision] = useState(Date.now());

  useEffect(() => {
    if (engine) {
      engine.onStateChange = () => setRevision(Date.now());
    }

    return () => {
      if (engine) {
        engine.onStateChange = () => {};
      }
    };
  }, [engine]);

  if (!engine) {
    return null;
  }

  // --- Click handlers for collapsed view ---
  const drawingStrategies: DrawingStrategy[] = [
    "naive",
    "path2d-direct",
    "path2d-translate",
    "optimized",
  ];
  const handleStrategyClick = () => {
    const currentIndex = drawingStrategies.indexOf(engine.drawingStrategy);
    const nextIndex = (currentIndex + 1) % drawingStrategies.length;
    engine.setDrawingStrategy(drawingStrategies[nextIndex]);
  };

  const animationTriggers: AnimationTrigger[] = ["raf", "event"];
  const handleTriggerClick = () => {
    const currentIndex = animationTriggers.indexOf(engine.animationTrigger);
    const nextIndex = (currentIndex + 1) % animationTriggers.length;
    engine.setAnimationTrigger(animationTriggers[nextIndex]);
  };

  const handleCometClick = () => {
    engine.setShowCometTrail(!engine.showCometTrail);
  };

  const handleMemoryClick = () => {
    engine.setForceUniqueSprites(!engine.forceUniqueSprites);
  };

  const liveFinalRadius =
    engine.liveStarRadius *
    (engine.liveMultipliers.m1 ? 10 : 1) *
    (engine.liveMultipliers.m2 ? 10 : 1);
  const totalLiveStars = Object.values(engine.liveStarCounts).reduce(
    (s, c) => s + c,
    0
  );

  const getStrategyLabel = (strategy: DrawingStrategy) => {
    switch (strategy) {
      case "naive":
        return "🐢 Наив.";
      case "path2d-direct":
        return "📐 Path2D Direct";
      case "path2d-translate":
        return "📐 Path2D Translate";
      case "optimized":
        return "🚀 Опт.";
    }
  };

  return (
    <>
      <div
        className={styles.headerContent}
        style={{ display: isHeaderCollapsed ? "block" : "none" }}
      >
        <div className={styles.collapsedHeaderContent}>
          <span className={styles.collapsedInfoItem}>
            ✨ {engine.totalStars}
          </span>
          <span className={styles.collapsedInfoItem}>
            📏 {engine.committedFinalRadius}px
          </span>
          <span
            className={`${styles.collapsedInfoItem} ${styles.clickable}`}
            onClick={handleStrategyClick}
          >
            {getStrategyLabel(engine.drawingStrategy)}
          </span>
          <span
            className={`${styles.collapsedInfoItem} ${styles.clickable}`}
            onClick={handleTriggerClick}
          >
            {engine.animationTrigger === "raf" ? " rAF " : " Событие "}
          </span>
          <span
            className={`${styles.collapsedInfoItem} ${styles.clickable}`}
            onClick={handleCometClick}
          >
            🌠 {engine.showCometTrail ? "Вкл" : "Выкл"}
          </span>
          <span
            className={`${styles.collapsedInfoItem} ${styles.clickable}`}
            onClick={handleMemoryClick}
          >
            🔥 {engine.forceUniqueSprites ? "Вкл" : "Выкл"}
          </span>
        </div>
      </div>

      <div
        className={styles.headerContent}
        style={{ display: isHeaderCollapsed ? "none" : "block" }}
      >
        <h1 className={styles.h1}>Песочница Оптимизации Canvas</h1>
        <div className={styles.controlsGrid}>
          <div className={styles.settingsColumn}>
            <div
              className={styles.settingsPanel}
              onMouseUp={engine.commitSettings}
              onTouchEnd={engine.commitSettings}
            >
              <h2 className={styles.settingsH2}>
                Настройки звезд ({totalLiveStars})
              </h2>
              <div className={styles.sliderGroup}>
                <label htmlFor="starRadius" className={styles.sliderLabel}>
                  Размер: {engine.liveStarRadius} (Итог: {liveFinalRadius})
                </label>
                <div className={styles.radiusControl}>
                  <input
                    type="range"
                    id="starRadius"
                    min="1"
                    max="10"
                    step="1"
                    value={engine.liveStarRadius}
                    onChange={(e) =>
                      engine.setLiveStarRadius(Number(e.target.value))
                    }
                  />
                  <div className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="mult1"
                      checked={engine.liveMultipliers.m1}
                      onChange={(e) =>
                        engine.setLiveMultipliers({
                          ...engine.liveMultipliers,
                          m1: e.target.checked,
                        })
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
                      checked={engine.liveMultipliers.m2}
                      onChange={(e) =>
                        engine.setLiveMultipliers({
                          ...engine.liveMultipliers,
                          m2: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="mult2" className={styles.sliderLabel}>
                      x10
                    </label>
                  </div>
                </div>
              </div>
              <hr className={styles.hr} />
              {(Object.keys(engine.liveStarCounts) as StarType[]).map(
                (type) => (
                  <div className={styles.sliderGroup} key={type}>
                    <label
                      htmlFor={`${type}Count`}
                      className={styles.sliderLabel}
                    >
                      {`${type.charAt(0).toUpperCase() + type.slice(1)}s`}:{" "}
                      {engine.liveStarCounts[type]}
                    </label>
                    <input
                      type="range"
                      id={`${type}Count`}
                      min="0"
                      max={type === "circle" ? 20000 : 10000}
                      step="500"
                      value={engine.liveStarCounts[type]}
                      onChange={(e) =>
                        engine.setLiveStarCounts({
                          ...engine.liveStarCounts,
                          [type]: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )
              )}
            </div>

            <div className={styles.buttonsContainer}>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => engine.setDrawingStrategy("naive")}
                  className={
                    engine.drawingStrategy === "naive" ? styles.activeNaive : ""
                  }
                >
                  Наивная
                </button>

                <button
                  onClick={() => engine.setDrawingStrategy("path2d-translate")}
                  className={
                    engine.drawingStrategy === "path2d-translate"
                      ? styles.activePath2dTranslate
                      : ""
                  }
                >
                  Path2D Translate
                </button>
                <button
                  onClick={() => engine.setDrawingStrategy("path2d-direct")}
                  className={
                    engine.drawingStrategy === "path2d-direct"
                      ? styles.activePath2dDirect
                      : ""
                  }
                >
                  Path2D Direct
                </button>
                <button
                  onClick={() => engine.setDrawingStrategy("optimized")}
                  className={
                    engine.drawingStrategy === "optimized"
                      ? styles.activeOptimized
                      : ""
                  }
                >
                  Оптимизированная
                </button>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => engine.setAnimationTrigger("raf")}
                  className={
                    engine.animationTrigger === "raf" ? styles.activeRaf : ""
                  }
                >
                  Триггер: rAF
                </button>
                <button
                  onClick={() => engine.setAnimationTrigger("event")}
                  className={
                    engine.animationTrigger === "event"
                      ? styles.activeEvent
                      : ""
                  }
                >
                  Триггер: Событие
                </button>
              </div>
              <div className={styles.optionsPanel}>
                <input
                  type="checkbox"
                  id="showComet"
                  checked={engine.showCometTrail}
                  onChange={(e) => engine.setShowCometTrail(e.target.checked)}
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
                  checked={engine.forceUniqueSprites}
                  onChange={(e) =>
                    engine.setForceUniqueSprites(e.target.checked)
                  }
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
      </div>

      <button
        onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
        className={styles.toggleButton}
      >
        {isHeaderCollapsed ? "⤓" : "⤒"}
      </button>
    </>
  );
}
