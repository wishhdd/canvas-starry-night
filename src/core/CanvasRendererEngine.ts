import type { AnimationTrigger } from "../types/animationTrigger";
import type { DrawingStrategy } from "../types/drawingStrategy";
import type { Point } from "../types/point";
import type { StarType } from "../types/starType";
import { drawPolygon } from "../utils/drawPolygon";
import { Star } from "./Star";

const STAR_HOVER_COLOR = "#fffd85";
const STAR_DRAG_COLOR = "#ff9d6e";
const TRACER_LENGTH = 20;
const INITIAL_STAR_RADIUS = 3;

/**
 * Основной класс, отвечающий за всю логику отрисовки и взаимодействия с Canvas.
 * Он инкапсулирует состояние рендеринга и управляет циклом анимации.
 */
export class CanvasRendererEngine {
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;

  // Props
  #stars: Star[] = [];
  #drawingStrategy: DrawingStrategy = "naive";
  #animationTrigger: AnimationTrigger = "raf";
  #forceUniqueSprites = false;
  #showCometTrail = true;
  #onFrameRendered: (time: number) => void = () => {};
  #onDrawCall: () => void = () => {};
  #onInteraction: () => void = () => {};

  // Internal state
  #draggedStar: Star | null = null;
  #hoveredStar: Star | null = null;
  #needsRedraw = true;
  #skyCache: HTMLCanvasElement | null = null;
  #spriteCache = new Map<string, HTMLCanvasElement>();
  #tracerPoints: Point[] = [];
  #mousePosition: Point = { x: -1, y: -1 };
  #animationFrameId: number | null = null;

  /**
   * @param {HTMLCanvasElement} canvas - DOM-элемент canvas, на котором будет происходить отрисовка.
   */
  constructor(canvas: HTMLCanvasElement) {
    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d")!;
  }

  /**
   * Обновляет внутренние свойства и состояние движка на основе новых пропсов из React-компонента.
   * @param {object} props - Новые свойства.
   */
  public update(
    props: Omit<
      import("../components/CanvasComponent/CanvasComponent").CanvasProps,
      "width" | "height"
    >
  ) {
    const didStrategyChange = this.#drawingStrategy !== props.drawingStrategy;
    const didStarsChange = this.#stars !== props.stars;
    const didForceCacheChange =
      this.#forceUniqueSprites !== props.forceUniqueSprites;

    this.#stars = props.stars;
    this.#drawingStrategy = props.drawingStrategy;
    this.#animationTrigger = props.animationTrigger;
    this.#forceUniqueSprites = props.forceUniqueSprites;
    this.#showCometTrail = props.showCometTrail;
    this.#onFrameRendered = props.onFrameRendered;
    this.#onDrawCall = props.onDrawCall;
    this.#onInteraction = props.onInteraction;

    if (didStrategyChange || didStarsChange || didForceCacheChange) {
      this.#initializeCaches();
    }
  }

  #initializeCaches() {
    if (this.#drawingStrategy === "optimized") {
      if (
        !this.#skyCache ||
        this.#skyCache.width !== this.#canvas.width ||
        this.#skyCache.height !== this.#canvas.height
      ) {
        this.#skyCache = document.createElement("canvas");
        this.#skyCache.width = this.#canvas.width;
        this.#skyCache.height = this.#canvas.height;
      }
      this.#spriteCache.clear();
      this.#regenerateSkyCache();
    } else {
      this.#spriteCache.clear();
    }
    this.#needsRedraw = true;
  }

  #drawTracer() {
    if (!this.#showCometTrail) return;
    for (let i = 0; i < this.#tracerPoints.length; i++) {
      const point = this.#tracerPoints[i];
      const opacity = 1 - i / this.#tracerPoints.length;
      const radius = 3 * opacity;
      this.#ctx.beginPath();
      this.#ctx.fillStyle = `rgba(103, 232, 249, ${opacity * 0.7})`;
      this.#ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      this.#ctx.fill();
    }
  }

  #renderNaive() {
    this.#onDrawCall();
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#stars.forEach((star) => {
      if (star === this.#draggedStar) return;
      const isHovered = star === this.#hoveredStar;
      const currentRadius = isHovered ? star.radius * 2.5 : star.radius;
      this.#ctx.fillStyle = isHovered ? STAR_HOVER_COLOR : star.color;
      switch (star.type) {
        case "triangle":
          drawPolygon(this.#ctx, star.x, star.y, currentRadius, 3);
          break;
        case "square":
          drawPolygon(this.#ctx, star.x, star.y, currentRadius, 4);
          break;
        case "pentagon":
          drawPolygon(this.#ctx, star.x, star.y, currentRadius, 5);
          break;
        case "hexagon":
          drawPolygon(this.#ctx, star.x, star.y, currentRadius, 6);
          break;
        case "circle":
        default:
          this.#ctx.beginPath();
          this.#ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
          break;
      }
      this.#ctx.fill();
    });
    if (this.#draggedStar) {
      const star = this.#draggedStar;
      const currentRadius = star.radius * 2.5;
      this.#ctx.fillStyle = STAR_DRAG_COLOR;
      switch (star.type) {
        case "triangle":
          drawPolygon(this.#ctx, star.x, star.y, currentRadius, 3);
          break;
        case "square":
          this.#ctx.beginPath();
          this.#ctx.rect(
            star.x - currentRadius,
            star.y - currentRadius,
            currentRadius * 2,
            currentRadius * 2
          );
          break;
        case "pentagon":
          drawPolygon(this.#ctx, star.x, star.y, currentRadius, 5);
          break;
        case "hexagon":
          drawPolygon(this.#ctx, star.x, star.y, currentRadius, 6);
          break;
        case "circle":
        default:
          this.#ctx.beginPath();
          this.#ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
          break;
      }
      this.#ctx.fill();
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
      this.#forceUniqueSprites && starId !== undefined
        ? `star-${starId}`
        : `shared-${color}-${radius}-${type}`;
    if (this.#spriteCache.has(key)) return this.#spriteCache.get(key)!;

    const sprite = document.createElement("canvas");
    const size = radius * 2 + 4;
    sprite.width = size;
    sprite.height = size;
    const ctx = sprite.getContext("2d")!;
    ctx.fillStyle = color;
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
    skyCtx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#stars.forEach((star) => {
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
    this.#onDrawCall();
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    if (this.#skyCache) this.#ctx.drawImage(this.#skyCache, 0, 0);

    if (this.#hoveredStar && this.#hoveredStar !== this.#draggedStar) {
      const star = this.#hoveredStar;
      const spriteHover = this.#getOrCreateSprite(
        STAR_HOVER_COLOR,
        star.radius * 2.5,
        star.type,
        star.id
      );
      this.#ctx.drawImage(
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
      this.#ctx.drawImage(
        spriteDrag,
        star.x - spriteDrag.width / 2,
        star.y - spriteDrag.height / 2
      );
    }
    this.#drawTracer();
  }

  #mainLoop = () => {
    if (this.#animationTrigger === "raf") {
      if (this.#showCometTrail) {
        this.#tracerPoints.unshift({ ...this.#mousePosition });
        if (this.#tracerPoints.length > TRACER_LENGTH) {
          this.#tracerPoints.pop();
        }
        this.#needsRedraw = true;
      } else if (this.#tracerPoints.length > 0) {
        this.#tracerPoints = [];
        this.#needsRedraw = true;
      }
    }

    if (this.#needsRedraw) {
      const start = performance.now();
      if (this.#drawingStrategy === "optimized") {
        this.#renderOptimized();
      } else {
        this.#renderNaive();
      }
      const end = performance.now();
      this.#onFrameRendered(end - start);
      this.#needsRedraw = false;
    }

    this.#animationFrameId = requestAnimationFrame(this.#mainLoop);
  };

  public start() {
    if (this.#animationFrameId === null) {
      this.#mainLoop();
    }
  }

  public stop() {
    if (this.#animationFrameId !== null) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }
  }

  #findStarAt(x: number, y: number): Star | null {
    const checkRadius = (this.#stars[0]?.radius || INITIAL_STAR_RADIUS) + 5;
    for (let i = this.#stars.length - 1; i >= 0; i--) {
      const star = this.#stars[i];
      const distance = Math.sqrt(
        Math.pow(star.x - x, 2) + Math.pow(star.y - y, 2)
      );
      if (distance < checkRadius) return star;
    }
    return null;
  }

  public handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    this.#onInteraction();
    const rect = this.#canvas.getBoundingClientRect();
    const star = this.#findStarAt(e.clientX - rect.left, e.clientY - rect.top);
    if (star) {
      this.#draggedStar = star;
      if (this.#drawingStrategy === "optimized") this.#regenerateSkyCache();
    }
    this.#needsRedraw = true;
  }

  public handleMouseUp() {
    this.#onInteraction();
    if (this.#draggedStar) {
      this.#draggedStar = null;
      if (this.#drawingStrategy === "optimized") this.#regenerateSkyCache();
    }
    this.#needsRedraw = true;
  }

  public handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = this.#canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    this.#mousePosition = { x: mouseX, y: mouseY };

    if (this.#showCometTrail && this.#animationTrigger === "event") {
      this.#tracerPoints.unshift({ x: mouseX, y: mouseY });
      if (this.#tracerPoints.length > TRACER_LENGTH) {
        this.#tracerPoints.pop();
      }
    }

    let stateChanged = false;
    if (this.#draggedStar) {
      this.#draggedStar.x = mouseX;
      this.#draggedStar.y = mouseY;
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
      (this.#showCometTrail && this.#animationTrigger === "event")
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
      if (this.#drawingStrategy === "optimized") this.#regenerateSkyCache();
      stateChanged = true;
    }
    if (stateChanged) this.#needsRedraw = true;
  }
}
