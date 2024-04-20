export interface Brush {
  color: string;
  size: number;
  reset(): void;
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
  setColor(color: string): void;
}
