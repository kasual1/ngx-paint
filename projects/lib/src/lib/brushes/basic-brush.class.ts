import { Brush } from "./brush.model";

export class BasicBrush implements Brush {
  color: string;
  size: number;

  constructor(color: string, size: number) {
    this.color = color;
    this.size = size;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(x - this.size / 2, y - this.size / 2, this.size, this.size);
  }

  reset(): void {
    // Nothing to reset for a basic brush
  }

  setColor(color: string): void {
    this.color = color;
  }

  setSize(size: number): void {
    this.size = size;
  }
}
