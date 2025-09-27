import type { AnimationTrigger } from "../types/animationTrigger";
import type { DrawingStrategy } from "../types/drawingStrategy";
import type { Point } from "../types/point";
import type { StarType } from "../types/starType";
import { drawPolygon } from "../utils/drawPolygon";
import { generateStars } from "../utils/generateStars";
import { Star } from "./Star";

const STAR_HOVER_COLOR = "#fffd85";
const STAR_DRAG_COLOR = "#ff9d6e";
const TRACER_LENGTH = 20;

/**
 * Основной класс, отвечающий за всю логику рендеринга и управление состоянием.
 */
export class CanvasRendererEngine {
  #canvas: HTMLCanvasElement | null = null;
  #ctx: CanvasRenderingContext2D | null = null;
  #isRunning = false;
  #isInitialized = false;

  // --- State managed internally ---
  public stars: Star[] = [];
  public drawingStrategy: DrawingStrategy = "naive";
  public animationTrigger: AnimationTrigger = "raf";
  public forceUniqueSprites = false;
  public showCometTrail = true;
  public onDraw: (() => void) | null = null;

  public liveStarCounts: Record<StarType, number> = {
    circle: 500,
    triangle: 0,
    square: 0,
    pentagon: 0,
    hexagon: 0,
  };
  public liveStarRadius = 3;
  public liveMultipliers = { m1: false, m2: false };

  #committedStarCounts = { ...this.liveStarCounts };
  #committedStarRadius = this.liveStarRadius;
  #committedMultipliers = { ...this.liveMultipliers };

  // --- Callbacks to notify React ---
  public onStateChange: () => void = () => {};

  // --- Metrics ---
  public fps = 0;
  public drawsPerSecond = 0;
  public frameTime = 0;
  public avgRenderTime = 0;
  public fpsHistory: number[] = [];
  public drawsPerSecondHistory: number[] = [];
  public frameTimeHistory: number[] = [];
  public avgRenderTimeHistory: number[] = [];
  #frameCount = 0;
  #drawCount = 0;
  #lastFpsTime = performance.now();
  #lastDrawsTime = performance.now();

  // --- Internal rendering state ---
  #draggedStar: Star | null = null;
  #hoveredStar: Star | null = null;
  #needsRedraw = true;
  #skyCache: HTMLCanvasElement | null = null;
  #spriteCache = new Map<string, HTMLCanvasElement>();
  #path2dCache = new Map<string, Path2D>();
  #tracerPoints: Point[] = [];
  #mousePosition: Point = { x: -1, y: -1 };
  #animationFrameId: number | null = null;

  // --- Public Getters ---
  public get totalStars() {
    return this.stars.length;
  }
  public get committedFinalRadius() {
    return (
      this.#committedStarRadius *
      (this.#committedMultipliers.m1 ? 10 : 1) *
      (this.#committedMultipliers.m2 ? 10 : 1)
    );
  }

  /**
   * Обрабатывает изменение размеров канваса
   */

  public handleResize() {
    if (!this.#canvas) {
      console.error("❌ Cannot handle resize: canvas is null");
      return;
    }

    console.log("🔄 Handling resize in engine");
    this.regenerateStars();
    this.#needsRedraw = true;

    console.log("✅ Resize handled");
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    // Защита от двойной инициализации
    if (this.#isInitialized) {
      console.log("⏭️ Engine already initialized, skipping setCanvas");
      return;
    }

    console.log("🎯 Initializing canvas engine...");

    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");

    if (!this.#ctx) {
      console.error("❌ Could not get 2D context!");
      return;
    }

    // НЕ регенерируем звезды здесь - это сделает resizeCanvas
    this.#isInitialized = true;

    console.log("✅ Canvas engine initialization completed");
  }

  // --- Public Setters for live state ---
  public setLiveStarCounts = (counts: Record<StarType, number>) => {
    this.liveStarCounts = counts;
    this.onStateChange();
  };
  public setLiveStarRadius = (radius: number) => {
    this.liveStarRadius = radius;
    this.onStateChange();
  };
  public setLiveMultipliers = (multipliers: { m1: boolean; m2: boolean }) => {
    this.liveMultipliers = multipliers;
    this.onStateChange();
  };

  // --- Public Setters for options that trigger re-render ---
  public setDrawingStrategy = (strategy: DrawingStrategy) => {
    if (this.drawingStrategy === strategy) return;
    this.drawingStrategy = strategy;
    this.#initializeCaches();
    this.resetHistories();
    this.onStateChange();
    this.#needsRedraw = true;
  };

  public setAnimationTrigger = (trigger: AnimationTrigger) => {
    if (this.animationTrigger === trigger) return;
    this.animationTrigger = trigger;
    this.resetHistories();
    this.onStateChange();
    this.#needsRedraw = true;
  };

  public setForceUniqueSprites = (value: boolean) => {
    if (this.forceUniqueSprites === value) return;
    this.forceUniqueSprites = value;
    this.#initializeCaches();
    this.resetHistories();
    this.onStateChange();
    this.#needsRedraw = true;
  };

  public setShowCometTrail = (value: boolean) => {
    if (this.showCometTrail === value) return;
    this.showCometTrail = value;
    this.resetHistories();
    this.onStateChange();
    this.#needsRedraw = true;
  };

  public commitSettings = () => {
    this.#committedStarCounts = { ...this.liveStarCounts };
    this.#committedStarRadius = this.liveStarRadius;
    this.#committedMultipliers = { ...this.liveMultipliers };
    this.regenerateStars();
    this.onStateChange();
  };

  public regenerateStars() {
    // Добавляем более четкую проверку
    if (!this.#canvas) {
      console.error(
        "❌ Cannot regenerate stars: canvas is null (engine not initialized)"
      );
      return;
    }

    // Проверяем что размеры валидные
    if (this.#canvas.width === 0 || this.#canvas.height === 0) {
      console.warn("⚠️ Canvas has zero size, skipping star generation");
      return;
    }

    console.log("🌟 regenerateStars() called");
    console.log(
      "📐 Canvas size for stars:",
      this.#canvas.width,
      "x",
      this.#canvas.height
    );

    this.stars = generateStars(
      this.#committedStarCounts,
      this.#canvas.width,
      this.#canvas.height,
      this.committedFinalRadius
    );

    this.#initializeCaches();
    this.#needsRedraw = true;
  }

  #initializeCaches() {
    if (!this.#canvas) return;
    this.#spriteCache.clear();
    this.#path2dCache.clear();

    if (this.drawingStrategy === "optimized") {
      if (
        !this.#skyCache ||
        this.#skyCache.width !== this.#canvas.width ||
        this.#skyCache.height !== this.#canvas.height
      ) {
        this.#skyCache = document.createElement("canvas");
        this.#skyCache.width = this.#canvas.width;
        this.#skyCache.height = this.#canvas.height;
      }
      this.#regenerateSkyCache();
    } else if (
      this.drawingStrategy === "path2d-direct" ||
      this.drawingStrategy === "path2d-translate"
    ) {
      this.stars.forEach((star) => {
        this.#getOrCreatePath2D(star);
      });
    }

    this.#needsRedraw = true;
  }

  #updateMetrics(time: number) {
    this.frameTime = time;
    this.avgRenderTime =
      this.totalStars > 0 && time > 0 ? (time * 1000) / this.totalStars : 0;
    if (time > 0.1) {
      const newHistory = [time, ...this.frameTimeHistory];
      const uniqueHistory = newHistory.filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.toFixed(2) === value.toFixed(2))
      );
      this.frameTimeHistory = uniqueHistory.slice(0, 4).sort((a, b) => a - b);
    }
    if (this.avgRenderTime > 0.01) {
      const newHistory = [this.avgRenderTime, ...this.avgRenderTimeHistory];
      const uniqueHistory = newHistory.filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.toFixed(2) === value.toFixed(2))
      );
      this.avgRenderTimeHistory = uniqueHistory
        .slice(0, 4)
        .sort((a, b) => a - b);
    }
  }

  #updateFps() {
    const now = performance.now();
    this.#frameCount++;
    if (now - this.#lastFpsTime >= 1000) {
      this.fps = this.#frameCount;
      this.#frameCount = 0;
      this.#lastFpsTime = now;
      if (this.fps > 0) {
        const newHistory = [this.fps, ...this.fpsHistory];
        const uniqueHistory = newHistory.filter(
          (v, i, s) => i === s.indexOf(v)
        );
        this.fpsHistory = uniqueHistory.slice(0, 4).sort((a, b) => b - a);
      }
    }
  }

  #updateDrawsPerSecond() {
    this.drawsPerSecond = this.#drawCount;
    this.#drawCount = 0;
    if (this.drawsPerSecond > 0 || this.animationTrigger === "event") {
      const newHistory = [this.drawsPerSecond, ...this.drawsPerSecondHistory];
      const uniqueHistory = newHistory.filter((v, i, s) => i === s.indexOf(v));
      this.drawsPerSecondHistory = uniqueHistory
        .slice(0, 4)
        .sort((a, b) => b - a);
    }
  }

  public resetHistories() {
    this.fpsHistory = [];
    this.drawsPerSecondHistory = [];
    this.frameTimeHistory = [];
    this.avgRenderTimeHistory = [];
    this.onStateChange();
  }

  #drawTracer() {
    if (!this.#ctx || !this.showCometTrail) return;
    const ctx = this.#ctx;
    for (let i = 0; i < this.#tracerPoints.length; i++) {
      const point = this.#tracerPoints[i];
      const opacity = 1 - i / this.#tracerPoints.length;
      const radius = 3 * opacity;
      ctx.beginPath();
      ctx.fillStyle = `rgba(103, 232, 249, ${opacity * 0.7})`;
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #drawStarShape(ctx: CanvasRenderingContext2D, star: Star, radius: number) {
    switch (star.type) {
      case "triangle":
        drawPolygon(ctx, star.x, star.y, radius, 3);
        break;
      case "square":
        ctx.beginPath();
        ctx.rect(star.x - radius, star.y - radius, radius * 2, radius * 2);
        break;
      case "pentagon":
        drawPolygon(ctx, star.x, star.y, radius, 5);
        break;
      case "hexagon":
        drawPolygon(ctx, star.x, star.y, radius, 6);
        break;
      case "circle":
      default:
        ctx.beginPath();
        ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
        break;
    }
  }

  #renderNaive() {
    if (!this.#ctx || !this.#canvas) {
      console.error("❌ Cannot render naive: ctx or canvas is null");
      return;
    }

    this.#drawCount++;
    if (this.onDraw) {
      this.onDraw();
    }
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

    this.stars.forEach((star) => {
      if (star === this.#draggedStar) return;
      const isHovered = star === this.#hoveredStar;
      const currentRadius = isHovered ? star.radius * 2.5 : star.radius;
      this.#ctx!.fillStyle = isHovered ? STAR_HOVER_COLOR : star.color;
      this.#drawStarShape(this.#ctx!, star, currentRadius);
      this.#ctx!.fill();
    });

    if (this.#draggedStar) {
      const star = this.#draggedStar;
      const currentRadius = star.radius * 2.5;
      this.#ctx!.fillStyle = STAR_DRAG_COLOR;
      this.#drawStarShape(this.#ctx!, star, currentRadius);
      this.#ctx!.fill();
    }

    this.#drawTracer();
  }

  #getOrCreatePath2D(star: Star, isRelative = false): Path2D {
    const key = isRelative
      ? `relative-${star.type}-${star.radius}`
      : `direct-${star.id}`;
    if (this.#path2dCache.has(key)) {
      return this.#path2dCache.get(key)!;
    }

    const path = new Path2D();
    const x = isRelative ? 0 : star.x;
    const y = isRelative ? 0 : star.y;

    switch (star.type) {
      case "triangle":
        drawPolygon(path, x, y, star.radius, 3);
        break;
      case "square":
        path.rect(
          x - star.radius,
          y - star.radius,
          star.radius * 2,
          star.radius * 2
        );
        break;
      case "pentagon":
        drawPolygon(path, x, y, star.radius, 5);
        break;
      case "hexagon":
        drawPolygon(path, x, y, star.radius, 6);
        break;
      case "circle":
      default:
        path.arc(x, y, star.radius, 0, Math.PI * 2);
        break;
    }
    this.#path2dCache.set(key, path);
    return path;
  }

  #renderPath2DDirect() {
    if (!this.#ctx || !this.#canvas) return;
    const ctx = this.#ctx;
    this.#drawCount++;
    if (this.onDraw) {
      this.onDraw();
    }
    ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.stars.forEach((star) => {
      if (star === this.#draggedStar) {
        return;
      }
      const path = this.#getOrCreatePath2D(star, false);
      const isHovered = star === this.#hoveredStar;
      ctx.fillStyle = isHovered ? STAR_HOVER_COLOR : star.color;
      ctx.fill(path);
    });
    if (this.#draggedStar) {
      const star = this.#draggedStar;
      this.#path2dCache.delete(`direct-${star.id}`); // Invalidate path on drag
      const path = this.#getOrCreatePath2D(star, false);
      ctx.fillStyle = STAR_DRAG_COLOR;
      ctx.fill(path);
    }
    this.#drawTracer();
  }

  #renderPath2DTranslate() {
    if (!this.#ctx || !this.#canvas) return;
    const ctx = this.#ctx;
    this.#drawCount++;
    if (this.onDraw) {
      this.onDraw();
    }
    ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.stars.forEach((star) => {
      if (star === this.#draggedStar) return;
      const path = this.#getOrCreatePath2D(star, true);
      const isHovered = star === this.#hoveredStar;
      ctx.fillStyle = isHovered ? STAR_HOVER_COLOR : star.color;

      ctx.save();
      ctx.translate(star.x, star.y);
      ctx.fill(path);
      ctx.restore();
    });
    if (this.#draggedStar) {
      const star = this.#draggedStar;
      const path = this.#getOrCreatePath2D(star, true);
      ctx.fillStyle = STAR_DRAG_COLOR;

      ctx.save();
      ctx.translate(star.x, star.y);
      ctx.scale(2.5, 2.5); // Scale for hover/drag effect
      ctx.fill(path);
      ctx.restore();
    }
    this.#drawTracer();
  }

  #getOrCreateSprite(
    color: string,
    radius: number,
    type: StarType,
    starId?: number
  ): HTMLCanvasElement {
    const key =
      this.forceUniqueSprites && starId !== undefined
        ? `star-${starId}`
        : `shared-${color}-${radius}-${type}`;
    if (this.#spriteCache.has(key)) return this.#spriteCache.get(key)!;

    const sprite = document.createElement("canvas");
    const size = radius * 2 + 4;
    sprite.width = size;
    sprite.height = size;
    const ctx = sprite.getContext("2d")!;
    ctx.fillStyle = color;
    // Draw centered in the sprite canvas
    switch (type) {
      case "triangle":
        drawPolygon(ctx, size / 2, size / 2, radius, 3);
        break;
      case "square":
        ctx.fillRect(
          size / 2 - radius,
          size / 2 - radius,
          radius * 2,
          radius * 2
        );
        break;
      case "pentagon":
        drawPolygon(ctx, size / 2, size / 2, radius, 5);
        break;
      case "hexagon":
        drawPolygon(ctx, size / 2, size / 2, radius, 6);
        break;
      case "circle":
      default:
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
    this.#spriteCache.set(key, sprite);
    return sprite;
  }

  #regenerateSkyCache() {
    if (!this.#skyCache) return;
    const skyCtx = this.#skyCache.getContext("2d")!;
    skyCtx.clearRect(0, 0, this.#skyCache.width, this.#skyCache.height);
    this.stars.forEach((star) => {
      if (star !== this.#draggedStar) {
        const sprite = this.#getOrCreateSprite(
          star.color,
          star.radius,
          star.type,
          star.id
        );
        skyCtx.drawImage(
          sprite,
          star.x - sprite.width / 2,
          star.y - sprite.height / 2
        );
      }
    });
    this.#needsRedraw = true;
  }

  #renderOptimized() {
    if (!this.#ctx || !this.#canvas) return;
    const ctx = this.#ctx;
    this.#drawCount++;
    if (this.onDraw) {
      this.onDraw();
    }
    ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    if (this.#skyCache) {
      ctx.drawImage(this.#skyCache, 0, 0);
    }

    if (this.#hoveredStar && this.#hoveredStar !== this.#draggedStar) {
      const star = this.#hoveredStar;
      const spriteHover = this.#getOrCreateSprite(
        STAR_HOVER_COLOR,
        star.radius * 2.5,
        star.type,
        star.id
      );
      ctx.drawImage(
        spriteHover,
        star.x - spriteHover.width / 2,
        star.y - spriteHover.height / 2
      );
    }

    if (this.#draggedStar) {
      const star = this.#draggedStar;
      const spriteDrag = this.#getOrCreateSprite(
        STAR_DRAG_COLOR,
        star.radius * 2.5,
        star.type,
        star.id
      );
      ctx.drawImage(
        spriteDrag,
        star.x - spriteDrag.width / 2,
        star.y - spriteDrag.height / 2
      );
    }
    this.#drawTracer();
  }

  #mainLoop = () => {
    if (!this.#isRunning) {
      console.log("🛑 Main loop stopped");
      this.#animationFrameId = null;
      return;
    }
    this.#updateFps();

    const now = performance.now();
    if (now - this.#lastDrawsTime >= 1000) {
      this.#updateDrawsPerSecond();
      this.#lastDrawsTime = now;
    }

    if (this.animationTrigger === "raf") {
      if (this.showCometTrail) {
        this.#tracerPoints.unshift({ ...this.#mousePosition });
        if (this.#tracerPoints.length > TRACER_LENGTH) this.#tracerPoints.pop();
        this.#needsRedraw = true;
      } else if (this.#tracerPoints.length > 0) {
        this.#tracerPoints = [];
        this.#needsRedraw = true;
      }
    }

    if (this.#needsRedraw) {
      const start = performance.now();

      switch (this.drawingStrategy) {
        case "optimized":
          this.#renderOptimized();
          break;
        case "path2d-direct":
          this.#renderPath2DDirect();
          break;
        case "path2d-translate":
          this.#renderPath2DTranslate();
          break;
        case "naive":
        default:
          this.#renderNaive();
          break;
      }

      const end = performance.now();

      this.#updateMetrics(end - start);
      this.#needsRedraw = false;
      this.onStateChange();
    }

    if (this.#isRunning) {
      this.#animationFrameId = requestAnimationFrame(this.#mainLoop);
    } else {
      this.#animationFrameId = null;
    }
  };

  public start() {
    console.log("🚀 CanvasRendererEngine.start() called");

    if (this.#isRunning) {
      console.log("⏭️ Engine already running, skipping start");
      return;
    }

    if (this.#animationFrameId === null) {
      console.log("🔄 Starting main loop");
      this.#isRunning = true;
      this.#needsRedraw = true;
      this.#mainLoop();
    }
  }

  public stop() {
    console.log("🛑 CanvasRendererEngine.stop() called");

    // Останавливаем только если это реальный stop, а не StrictMode unmount
    if (this.#animationFrameId !== null) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
      this.#isRunning = false;
      console.log("✅ Animation frame cancelled");
    }
  }

  #findStarAt(x: number, y: number): Star | null {
    const checkRadius = (this.stars[0]?.radius || 3) + 5;
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i];
      const distance = Math.sqrt(
        Math.pow(star.x - x, 2) + Math.pow(star.y - y, 2)
      );
      if (distance < checkRadius) return star;
    }
    return null;
  }

  public handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!this.#canvas) return;
    this.resetHistories();
    const rect = this.#canvas.getBoundingClientRect();
    const star = this.#findStarAt(e.clientX - rect.left, e.clientY - rect.top);
    if (star) {
      this.#draggedStar = star;
      if (this.drawingStrategy === "optimized") this.#regenerateSkyCache();
    }
    this.#needsRedraw = true;
  }

  public handleMouseUp() {
    this.resetHistories();
    if (this.#draggedStar) {
      const draggedId = this.#draggedStar.id;
      this.#draggedStar = null;

      if (this.drawingStrategy === "optimized") {
        this.#regenerateSkyCache();
      } else if (
        this.drawingStrategy === "path2d-direct" ||
        this.drawingStrategy === "path2d-translate"
      ) {
        this.#path2dCache.delete(`direct-${draggedId}`);
        this.#path2dCache.delete(
          `relative-${this.stars.find((s) => s.id === draggedId)?.type}-${
            this.stars.find((s) => s.id === draggedId)?.radius
          }`
        );
      }
    }
    this.#needsRedraw = true;
  }

  public handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!this.#canvas) return;
    const rect = this.#canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    this.#mousePosition = { x: mouseX, y: mouseY };

    if (this.showCometTrail && this.animationTrigger === "event") {
      this.#tracerPoints.unshift({ x: mouseX, y: mouseY });
      if (this.#tracerPoints.length > TRACER_LENGTH) {
        this.#tracerPoints.pop();
      }
    }

    let stateChanged = false;
    if (this.#draggedStar) {
      this.#draggedStar.x = mouseX;
      this.#draggedStar.y = mouseY;
      if (this.drawingStrategy === "path2d-direct") {
        this.#path2dCache.delete(`direct-${this.#draggedStar.id}`);
      }
      stateChanged = true;
    } else {
      const currentHovered = this.#findStarAt(mouseX, mouseY);
      if (this.#hoveredStar !== currentHovered) {
        this.#hoveredStar = currentHovered;
        stateChanged = true;
      }
    }

    if (
      stateChanged ||
      (this.showCometTrail && this.animationTrigger === "event")
    ) {
      this.#needsRedraw = true;
    }
  }

  public handleMouseLeave() {
    this.#tracerPoints = [];
    let stateChanged = false;
    if (this.#hoveredStar) {
      this.#hoveredStar = null;
      stateChanged = true;
    }
    if (this.#draggedStar) {
      this.#draggedStar = null;
      if (this.drawingStrategy === "optimized") this.#regenerateSkyCache();
      stateChanged = true;
    }
    if (stateChanged) this.#needsRedraw = true;
  }
}
