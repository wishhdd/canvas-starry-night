import { useEffect, useRef } from "react";
import { CanvasRendererEngine } from "../../core/CanvasRendererEngine";
import styles from "./CanvasComponent.module.scss";

interface CanvasComponentProps {
  engine: CanvasRendererEngine;
}

export function CanvasComponent({ engine }: CanvasComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;

    if (!canvasRef.current || !wrapperRef.current) {
      return;
    }

    isInitializedRef.current = true;
    console.log("🔵 CanvasComponent mounted - INITIALIZING");

    const resizeCanvas = () => {
      if (!wrapperRef.current || !canvasRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 100);
      const height = Math.max(rect.height, 100);

      console.log("📏 Resizing canvas to:", width, "x", height);

      canvasRef.current.width = width;
      canvasRef.current.height = height;
      engine.handleResize();
    };

    // Инициализация
    engine.setCanvas(canvasRef.current);
    resizeCanvas();
    engine.start();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(wrapperRef.current);
    window.addEventListener("resize", resizeCanvas);

    console.log(
      "✅ CanvasComponent fully initialized with permanent listeners"
    );
    return () => {
      console.log("🛑 CanvasComponent cleanup (IGNORED - listeners remain)");
    };
  }, [engine]);

  return (
    <div ref={wrapperRef} className={styles.canvasWrapper}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={(e) => engine.handleMouseDown(e)}
        onMouseUp={() => engine.handleMouseUp()}
        onMouseMove={(e) => engine.handleMouseMove(e)}
        onMouseLeave={() => engine.handleMouseLeave()}
      />
    </div>
  );
}
