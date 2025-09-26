import React, { useEffect, useRef } from "react";
import { CanvasRendererEngine } from "../../core/CanvasRendererEngine";
import type { Star } from "../../core/Star";
import type { AnimationTrigger } from "../../types/animationTrigger";
import type { DrawingStrategy } from "../../types/drawingStrategy";
import styles from "./CanvasComponent.module.scss";

/**
 * Пропсы для компонента CanvasComponent.
 */
export interface CanvasProps {
  stars: Star[];
  drawingStrategy: DrawingStrategy;
  animationTrigger: AnimationTrigger;
  forceUniqueSprites: boolean;
  showCometTrail: boolean;
  width: number;
  height: number;
  onFrameRendered: (time: number) => void;
  onDrawCall: () => void;
  onInteraction: () => void;
}

/**
 * React-компонент-обертка для Canvas.
 * Его основная задача - управлять жизненным циклом экземпляра CanvasRendererEngine
 * и передавать ему актуальные пропсы.
 * @param {CanvasProps} props - Пропсы компонента.
 * @returns {JSX.Element}
 */
export const CanvasComponent: React.FC<CanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRendererEngine | null>(null);

  // Инициализация движка при монтировании компонента
  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new CanvasRendererEngine(canvasRef.current);
      rendererRef.current.start();
    }
    return () => {
      rendererRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.update(props);
  }, [props]);

  return (
    <canvas
      ref={canvasRef}
      width={props.width}
      height={props.height}
      className={styles.canvas}
      onMouseDown={(e) => rendererRef.current?.handleMouseDown(e)}
      onMouseUp={() => rendererRef.current?.handleMouseUp()}
      onMouseMove={(e) => rendererRef.current?.handleMouseMove(e)}
      onMouseLeave={() => rendererRef.current?.handleMouseLeave()}
    />
  );
};
