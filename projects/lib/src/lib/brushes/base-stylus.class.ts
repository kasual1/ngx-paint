import { CanvasHelper } from "../helper/canvas.helper";
import { Brush, BrushType } from "./base-brush.class";

export class BaseStylus implements Brush {
  name: string = 'Stylus';
  type: BrushType = BrushType.Stylus;
  icon: string = 'stylus';
  color: string;
  size: number;
  lineCap: CanvasLineCap = 'round';
  lineJoin: CanvasLineJoin = 'round';
  prevX: number | null = null;
  prevY: number | null = null;

  f = 0.5;
  spring = 0.5;
  friction = 0.5;

  distanceX = 0;
  distanceY = 0;

  accelarationX = 0;
  accelarationY = 0;

  velocityX = 0;
  velocityY = 0;

  v = 0;
  dynamicLineWidth = 0;

  constructor(name: string, color: string, size: number) {
    this.name = name;
    this.color = color;
    this.size = size;
  }

  down(x: number, y: number): void {
    this.prevX = x;
    this.prevY = y;
  }

  up(): void {
    this.velocityX = 0;
    this.velocityY = 0;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (!this.prevX || !this.prevY) {
      return;
    }

    this.velocityX += ( this.prevX - x ) * this.spring;
    this.velocityY += ( this.prevY - y ) * this.spring;

    this.velocityX *= this.friction;
    this.velocityY *= this.friction;

    this.v += Math.sqrt( this.velocityX * this.velocityX + this.velocityY * this.velocityY ) - this.v;
    this.v *= 0.6;

    this.dynamicLineWidth = this.size - this.v;

    if(this.dynamicLineWidth < 10) { this.dynamicLineWidth = 10; }

    x += this.velocityX;
    y += this.velocityY;

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.dynamicLineWidth;
    ctx.lineJoin = this.lineJoin;
    ctx.lineCap = this.lineCap;

    CanvasHelper.drawLine(ctx, this.prevX, this.prevY, x, y);

    this.prevX = x;
    this.prevY = y;
  }

  reset(): void {
    // Nothing to reset for a circle brush
  }
}
