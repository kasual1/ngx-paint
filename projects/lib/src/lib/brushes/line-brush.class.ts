import { Brush } from "./brush.model";

export class LineBrush implements Brush {
  name: string;
  icon: string = 'brush';
  color: string;
  size: number;
  prevX: number | null = null;
  prevY: number | null = null;

  constructor(name: string, color: string, lineWidth: number = 2) {
    this.name = name;
    this.color = color;
    this.size = lineWidth;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round'; // Round line caps for smoother connection

    if (this.prevX !== null && this.prevY !== null) {
      ctx.beginPath();
      ctx.moveTo(this.prevX, this.prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    this.prevX = x;
    this.prevY = y;
  }

  reset(): void {
    this.prevX = null;
    this.prevY = null;
  }

  setColor(color: string): void {
    this.color = color;
  }

  setSize(size: number): void {
    this.size = size;
  }
}
