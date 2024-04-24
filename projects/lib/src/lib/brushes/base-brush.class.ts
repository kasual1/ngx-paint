import { CanvasHelper } from "../helper/canvas.helper";

export enum BrushType {
  Brush = 'Brush',
  Stylus = 'Stylus',
}

export interface Brush {
  name: string;
  type: BrushType;
  icon: string;
  color: string;
  size: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;

  prevX: number | null;
  prevY: number | null;

  down(x: number, y: number): void;
  up(): void;
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}

export class BaseBrush implements Brush {
  name: string = 'Base';
  type: BrushType = BrushType.Brush;
  icon: string = 'brush';
  color: string = 'black';
  size: number = 5;
  lineCap: CanvasLineCap = 'round';
  lineJoin: CanvasLineJoin = 'round';
  prevX: number | null = null;
  prevY: number | null = null;

  constructor(name: string, color: string, size: number = 2) {
    this.name = name;
    this.color = color;
    this.size = size;
  }

  down(x: number, y: number): void {
    this.prevX = x;
    this.prevY = y;
  }

  up(): void {
    this.prevX = null;
    this.prevY = null;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if(!this.prevX || !this.prevY){
      return;
    }

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineJoin = this.lineJoin;
    ctx.lineCap = this.lineCap;

    CanvasHelper.drawLine(ctx, this.prevX, this.prevY, x, y);

    this.prevX = x;
    this.prevY = y;
  }
}
