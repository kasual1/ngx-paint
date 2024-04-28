import { CanvasHelper } from "../helper/canvas.helper";
import { TrigonometryHelper } from "../helper/trigonometry.helper";

export enum BrushType {
  Brush = 'Brush',
  Stylus = 'Stylus',
  Eraser = 'Eraser'
}

export interface Brush {
  name: string;
  type: BrushType;
  icon: string;
  color: string;
  size: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  texture?: HTMLImageElement;

  prevX: number | null;
  prevY: number | null;


  down(x: number, y: number): void;
  up(): void;
  draw(ctx: CanvasRenderingContext2D | null, x: number, y: number): void;

  getCurrentLineSegment(x: number, y: number): LineSegment;

}

export interface BrushOptions {
  color?: string;
  size: number;
  velocityMagnitude?: number;
  velocityX?: number;
  velocityY?: number;
}

export interface LineSegment {
  x: number;
  y: number;
  prevX?: number;
  prevY?: number;
  type: BrushType;
  color: string;
  size: number;
  velocityMagnitude?: number;
  velocityX?: number;
  velocityY?: number;
}

export class BaseBrush implements Brush {
  name: string = 'Base';
  type: BrushType = BrushType.Brush;
  icon: string = 'brush';
  color: string = 'black';
  size: number = 5;
  lineCap: CanvasLineCap = 'round';
  lineJoin: CanvasLineJoin = 'round';
  texture?: HTMLImageElement;

  prevX: number | null = null;
  prevY: number | null = null;

  constructor(name: string, options: BrushOptions) {
    if(!options.color) {
      throw new Error('Color is required for brush');
    }

    this.name = name;
    this.color = options.color;
    this.size = options.size;

    this.texture = new Image();
    this.texture.src = 'assets/brush2.png';
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

    let distance = TrigonometryHelper.getDistance(this.prevX, this.prevY, x, y);
    let angle = TrigonometryHelper.getAngle(this.prevX, this.prevY, x, y);

    let steps = Math.ceil(distance);
    for(let i = 0; i < distance; i ++){
      let t = i / (steps - 1);
      let interpolatedX = this.prevX + (x - this.prevX) * t;
      let interpolatedY = this.prevY + (y - this.prevY) * t;

      interpolatedX += Math.sin(angle) * Math.random() * this.size;
      interpolatedY += Math.cos(angle) * Math.random() * this.size;

      ctx.drawImage(this.texture!, interpolatedX - this.size / 2, interpolatedY - this.size / 2, this.size, this.size);
    }

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
