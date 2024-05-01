import { CanvasHelper } from "../helper/canvas.helper";
import { TrigonometryHelper } from "../helper/trigonometry.helper";
import { Brush, BrushOptions, BrushType, LineSegment } from "./base-brush.class";

export class BaseStylus implements Brush {
  name: string = 'Stylus';
  type: BrushType = BrushType.Stylus;
  icon: string = 'stylus';
  color: string;
  size: number;
  lineCap: CanvasLineCap = 'round';
  lineJoin: CanvasLineJoin = 'round';
  texture?: HTMLImageElement | undefined;

  prevX: number | null = null;
  prevY: number | null = null;

  f = 0.5;
  spring = 0.5;
  friction = 0.5;

  velocityX = 0;
  velocityY = 0;

  velocityMagnitude = 0;
  dynamicLineWidth = 0;

  constructor(name: string, options: BrushOptions) {
    if(!options.color) {
      throw new Error('Color is required for stylus');
    }

    this.name = name;
    this.color = options.color;
    this.size = options.size;
    this.velocityMagnitude = options.velocityMagnitude ?? 0;
    this.velocityX = options.velocityX ?? 0;
    this.velocityY = options.velocityY ?? 0;

    if (options.texture) {
      this.texture = options.texture;
    } else {
      this.texture = new Image();
      this.texture.src = 'assets/custom_brush_1.png';
    }

    this.texture.onload = () => {
      this.texture = CanvasHelper.createTintedImage(this.texture!, this.color)
    }
  }

  setColor(color: string): void {
    debugger;

    this.color = color;
    this.texture = CanvasHelper.createTintedImage(this.texture!, this.color);
  }

  down(x: number, y: number): void {
    this.prevX = x;
    this.prevY = y;
  }

  up(): void {
    this.prevX = null;
    this.prevY = null;
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityMagnitude = 0;
    this.dynamicLineWidth = 0;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (!ctx || !this.prevX || !this.prevY) {
      return;
    }

    this.velocityX += ( this.prevX - x ) * this.spring;
    this.velocityY += ( this.prevY - y ) * this.spring;

    this.velocityX *= this.friction;
    this.velocityY *= this.friction;

    this.velocityMagnitude += Math.sqrt( this.velocityX * this.velocityX + this.velocityY * this.velocityY ) - this.velocityMagnitude;
    this.velocityMagnitude *= 0.6;

    this.dynamicLineWidth = this.size - this.velocityMagnitude;

    if(this.dynamicLineWidth < 10) { this.dynamicLineWidth = 10; }

    x += this.velocityX;
    y += this.velocityY;

    let distance = TrigonometryHelper.getDistance(this.prevX, this.prevY, x, y);
    let steps = Math.ceil(distance);

    for(let i = 0; i < distance; i ++){
      let t = i / (steps - 1);
      let interpolatedX = this.prevX + (x - this.prevX) * t;
      let interpolatedY = this.prevY + (y - this.prevY) * t;

      ctx.drawImage(this.texture!, interpolatedX - this.dynamicLineWidth / 2, interpolatedY - this.dynamicLineWidth / 2, this.dynamicLineWidth, this.dynamicLineWidth);
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
      velocityMagnitude: this.velocityMagnitude,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      texture: this.texture
    };
  }

}
