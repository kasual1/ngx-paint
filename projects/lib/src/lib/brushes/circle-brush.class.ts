import { Brush } from "./brush.model";

export class CircleBrush implements Brush {
  color: string;
  size: number;

  constructor(color: string, size: number) {
    this.color = color;
    this.size = size;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.beginPath();
    ctx.arc(x, y, this.size / 2, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  reset(): void {
    // Nothing to reset for a circle brush
  }

  setColor(color: string): void {
    this.color = color;
  }
}
