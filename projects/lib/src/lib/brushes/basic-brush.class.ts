import { Brush, BrushType } from "./brush.model";

export class BasicBrush implements Brush {
  name: string;
  type: BrushType = BrushType.Basic;
  icon: string = 'ink_pen';
  color: string;
  size: number;

  constructor(name: string, color: string, size: number) {
    this.name = name;
    this.color = color;
    this.size = size;
  }

  down(x: number, y: number): void {
    // Nothing to do on mouse down for a basic brush
  }

  up(): void {
    // Nothing to do on mouse up for a basic brush
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
