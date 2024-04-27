import { CanvasHelper } from "../helper/canvas.helper";
import { Brush, BrushOptions, BrushType, LineSegment } from "./base-brush.class";

export class BaseEraser implements Brush {
  name: string = 'Eraser';
  type: BrushType = BrushType.Eraser;
  icon: string = 'ink_eraser';
  color: string = '';
  size: number = 5;
  lineCap: CanvasLineCap = 'round';
  lineJoin: CanvasLineJoin = 'round';

  prevX: number | null = null;
  prevY: number | null = null;

  constructor(name: string, options: BrushOptions) {
    this.name = name;
    this.size = options.size;
  }

  down(x: number, y: number): void {
    this.prevX = x;
    this.prevY = y;
  }

  up(): void {
    this.prevX = null;
    this.prevY = null;
  }

  draw(ctx: CanvasRenderingContext2D | null, x: number, y: number): void {
    if(!ctx || !this.prevX || !this.prevY){
      return;
    }

    ctx.lineWidth = this.size;
    ctx.lineJoin = this.lineJoin;
    ctx.lineCap = this.lineCap;
    ctx.globalCompositeOperation = 'destination-out';

    CanvasHelper.drawLine(ctx, this.prevX, this.prevY, x, y);

    ctx.globalCompositeOperation = 'source-over';

    this.prevX = x;
    this.prevY = y;
  }

  getCurrentLineSegment(x: number, y: number): LineSegment {
    return {
      x,
      y,
      prevX: this.prevX!,
      prevY: this.prevY!,
      type: this.type,
      color: this.color,
      size: this.size,
    };
  }
}
