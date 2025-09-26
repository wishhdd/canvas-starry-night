import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./App.module.scss";
import { CanvasComponent } from "./components/CanvasComponent/CanvasComponent";
import { Controls } from "./components/Controls/Controls";
import { Metrics } from "./components/Metrics/Metrics";
import { Star } from "./core/Star";
import { useDrawCounter } from "./hooks/useDrawCounter";
import { useFps } from "./hooks/useFps";
import type { StarType } from "./types/starType";
import { generateStars } from "./utils/generateStars";

/**
 * Главный компонент приложения, который собирает все части вместе.
 * Отвечает за управление состоянием, рендеринг UI и передачу данных
 * в дочерние компоненты.
 */
export default function App() {
  const [committedStarCounts, setCommittedStarCounts] = useState<
    Record<StarType, number>
  >({ circle: 5000, triangle: 0, square: 0, pentagon: 0, hexagon: 0 });
  const [committedStarRadius, setCommittedStarRadius] = useState(3);
  const [committedMultipliers, setCommittedMultipliers] = useState({
    m1: false,
    m2: false,
  });

  const [liveStarCounts, setLiveStarCounts] = useState(committedStarCounts);
  const [liveStarRadius, setLiveStarRadius] = useState(committedStarRadius);
  const [liveMultipliers, setLiveMultipliers] = useState(committedMultipliers);

  const [drawingStrategy, setDrawingStrategy] = useState<
    "naive" | "path2d" | "optimized"
  >("optimized");
  const [animationTrigger, setAnimationTrigger] = useState<"raf" | "event">(
    "raf"
  );
  const [forceUniqueSprites, setForceUniqueSprites] = useState(false);
  const [showCometTrail, setShowCometTrail] = useState(true);

  const [frameTime, setFrameTime] = useState(0);
  const [frameTimeHistory, setFrameTimeHistory] = useState<number[]>([]);
  const [drawsPerSecondHistory, setDrawsPerSecondHistory] = useState<number[]>(
    []
  );
  const [avgRenderTimeHistory, setAvgRenderTimeHistory] = useState<number[]>(
    []
  );
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const committedFinalRadius =
    committedStarRadius *
    (committedMultipliers.m1 ? 10 : 1) *
    (committedMultipliers.m2 ? 10 : 1);
  const totalStars = Object.values(committedStarCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const avgRenderTime =
    totalStars > 0 && frameTime > 0 ? (frameTime * 1000) / totalStars : 0;

  const [stars, setStars] = useState<Star[]>([]);

  const fps = useFps();
  const { drawsPerSecond, increment: incrementDrawCount } = useDrawCounter();

  const headerRef = useRef<HTMLDivElement>(null);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 380);

  const resetHistories = useCallback(() => {
    setFrameTimeHistory([]);
    setDrawsPerSecondHistory([]);
    setAvgRenderTimeHistory([]);
    setFpsHistory([]);
  }, []);

  const handleFrameRendered = useCallback((time: number) => {
    setFrameTime(time);
    if (time > 0.1) {
      setFrameTimeHistory((prev) => {
        const newHistory = [time, ...prev];
        const uniqueHistory = newHistory.filter(
          (value, index, self) =>
            index === self.findIndex((t) => t.toFixed(2) === value.toFixed(2))
        );
        return uniqueHistory.slice(0, 4).sort((a, b) => a - b);
      });
    }
  }, []);

  useEffect(() => {
    if (drawsPerSecond > 0 || animationTrigger === "event") {
      setDrawsPerSecondHistory((prev) => {
        const newHistory = [drawsPerSecond, ...prev];
        const uniqueHistory = newHistory.filter(
          (value, index, self) => index === self.indexOf(value)
        );
        return uniqueHistory.slice(0, 4).sort((a, b) => b - a);
      });
    }
  }, [drawsPerSecond, animationTrigger]);

  useEffect(() => {
    if (avgRenderTime > 0.01) {
      setAvgRenderTimeHistory((prev) => {
        const newHistory = [avgRenderTime, ...prev];
        const uniqueHistory = newHistory.filter(
          (value, index, self) =>
            index === self.findIndex((t) => t.toFixed(2) === value.toFixed(2))
        );
        return uniqueHistory.slice(0, 4).sort((a, b) => a - b);
      });
    }
  }, [avgRenderTime]);

  useEffect(() => {
    if (fps > 0) {
      setFpsHistory((prev) => {
        const newHistory = [fps, ...prev];
        const uniqueHistory = newHistory.filter(
          (value, index, self) => index === self.indexOf(value)
        );
        return uniqueHistory.slice(0, 4).sort((a, b) => b - a);
      });
    }
  }, [fps]);

  useEffect(() => {
    const calculateHeight = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.getBoundingClientRect().height;
        setCanvasHeight(window.innerHeight - headerHeight - 32);
      }
    };
    calculateHeight();
    const observer = new ResizeObserver(calculateHeight);
    if (headerRef.current) observer.observe(headerRef.current);
    window.addEventListener("resize", calculateHeight);

    return () => {
      if (headerRef.current) observer.unobserve(headerRef.current);
      window.removeEventListener("resize", calculateHeight);
    };
  }, [isHeaderCollapsed]);

  useEffect(() => {
    setStars(
      generateStars(
        committedStarCounts,
        window.innerWidth - 32,
        canvasHeight,
        committedFinalRadius
      )
    );
  }, [committedStarCounts, committedFinalRadius, canvasHeight]);

  const handleCommitSettings = () => {
    setCommittedStarCounts(liveStarCounts);
    setCommittedStarRadius(liveStarRadius);
    setCommittedMultipliers(liveMultipliers);
  };

  return (
    <div className={styles.appContainer}>
      <header
        ref={headerRef}
        className={`${styles.header} ${
          isHeaderCollapsed ? styles.headerCollapsed : ""
        }`}
      >
        <Controls
          isHeaderCollapsed={isHeaderCollapsed}
          setIsHeaderCollapsed={setIsHeaderCollapsed}
          totalStars={totalStars}
          committedFinalRadius={committedFinalRadius}
          drawingStrategy={drawingStrategy}
          animationTrigger={animationTrigger}
          showCometTrail={showCometTrail}
          forceUniqueSprites={forceUniqueSprites}
          liveStarCounts={liveStarCounts}
          liveStarRadius={liveStarRadius}
          liveMultipliers={liveMultipliers}
          onCommitSettings={handleCommitSettings}
          setDrawingStrategy={setDrawingStrategy}
          setAnimationTrigger={setAnimationTrigger}
          setShowCometTrail={setShowCometTrail}
          setForceUniqueSprites={setForceUniqueSprites}
          setLiveStarCounts={setLiveStarCounts}
          setLiveStarRadius={setLiveStarRadius}
          setLiveMultipliers={setLiveMultipliers}
        />
      </header>

      <main className={styles.mainContent}>
        <Metrics
          isOverlay={true}
          fps={fps}
          fpsHistory={fpsHistory}
          drawsPerSecond={drawsPerSecond}
          drawsPerSecondHistory={drawsPerSecondHistory}
          frameTime={frameTime}
          frameTimeHistory={frameTimeHistory}
          avgRenderTime={avgRenderTime}
          avgRenderTimeHistory={avgRenderTimeHistory}
        />
        <CanvasComponent
          stars={stars}
          drawingStrategy={drawingStrategy}
          animationTrigger={animationTrigger}
          forceUniqueSprites={forceUniqueSprites}
          showCometTrail={showCometTrail}
          width={window.innerWidth - 32}
          height={canvasHeight}
          onFrameRendered={handleFrameRendered}
          onDrawCall={incrementDrawCount}
          onInteraction={resetHistories}
        />
      </main>
    </div>
  );
}
