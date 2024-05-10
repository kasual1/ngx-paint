import { CanvasHelper } from "../helper/canvas.helper";
import { TrigonometryHelper } from "../helper/trigonometry.helper";

export enum BrushType {
  Brush = 'Brush',
  Stylus = 'Stylus',
  Eraser = 'Eraser'
}

export interface BrushOptions {
  color?: string;
  size: number;
  texture?: HTMLImageElement;
}

export class Brush  {
  private _name: string = 'Stylus';
  private _type: BrushType = BrushType.Stylus;
  private _icon: string = 'stylus';
  private _color: string;
  private _size: number;
  private _texture?: HTMLImageElement | undefined;

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

    this._name = name;
    this._color = options.color ?? '#000000';
    this._size = options.size;

    if (options.texture) {
      this._texture = options.texture;
    } else {
      this._texture = new Image();
      this._texture.src = 'assets/custom_brush_1.png';
    }

    this._texture.onload = () => {
      this._texture = CanvasHelper.createTintedImage(this._texture!, this._color);
    };
  }

  get name(): string {
    return this._name;
  }

  get type(): BrushType {
    return this._type;
  }

  get icon(): string {
    return this._icon;
  }

  get color(): string {
    return this._color;
  }

  get size(): number {
    return this._size;
  }

  set color(color: string) {
    this._color = color;
    this._texture = CanvasHelper.createTintedImage(this._texture!, this._color);
  }

  set size(size: number) {
    this._size = size;
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

    this.velocityX += (this.prevX - x) * this.spring;
    this.velocityY += (this.prevY - y) * this.spring;

    this.velocityX *= this.friction;
    this.velocityY *= this.friction;

    this.velocityMagnitude +=
      Math.sqrt(
        this.velocityX * this.velocityX + this.velocityY * this.velocityY
      ) - this.velocityMagnitude;
    this.velocityMagnitude *= 0.6;

    this.dynamicLineWidth = this._size - this.velocityMagnitude;

    if (this.dynamicLineWidth < 10) {
      this.dynamicLineWidth = 10;
    }

    x += this.velocityX;
    y += this.velocityY;

    let distance = TrigonometryHelper.getDistance(this.prevX, this.prevY, x, y);
    let steps = Math.ceil(distance);

    for (let i = 0; i < distance; i++) {
      let t = i / (steps - 1);
      let interpolatedX = this.prevX + (x - this.prevX) * t;
      let interpolatedY = this.prevY + (y - this.prevY) * t;

      ctx.drawImage(
        this._texture!,
        interpolatedX - this.dynamicLineWidth / 2,
        interpolatedY - this.dynamicLineWidth / 2,
        this.dynamicLineWidth,
        this.dynamicLineWidth
      );
    }

    this.prevX = x;
    this.prevY = y;
  }
}
