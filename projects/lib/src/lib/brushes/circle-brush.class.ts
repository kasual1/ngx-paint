import { Brush, BrushType } from "./brush.model";

export class CircleBrush implements Brush {
  name: string;
  type: BrushType = BrushType.Circle;
  icon: string = 'stylus';
  color: string;
  size: number;

  f = 0.5;
  spring = 0.5;
  friction = 0.5;

  x = 0;
  y = 0;

  downX = 0;
  downY = 0;

  distanceX = 0;
  distanceY = 0;

  accelarationX = 0;
  accelarationY = 0;

  velocityX = 0;
  velocityY = 0;

  v = 0;
  r = 0;

  constructor(name: string, color: string, size: number) {
    this.name = name;
    this.color = color;
    this.size = size;
  }

  down(x: number, y: number): void {
    this.downX = x;
    this.downY = y;
  }

  up(): void {
    this.velocityX = 0;
    this.velocityY = 0;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.beginPath();

    this.velocityX += ( this.downX - x ) * this.spring;
    this.velocityY += ( this.downY - y ) * this.spring;

    this.velocityX *= this.friction;
    this.velocityY *= this.friction;

    this.v += Math.sqrt( this.velocityX * this.velocityX + this.velocityY * this.velocityY ) - this.v;
    this.v *= 0.6;

    this.r = this.size - this.v;

    if(this.r < 10) { this.r = 10; }

    x += this.velocityX;
    y += this.velocityY;

    ctx.lineWidth = this.r;


    this.line(ctx, x, y, this.downX, this.downY );

    this.downX = x;
    this.downY = y;
  }

  private line(ctx: any, x1: any, y1: any, x2: any, y2: any) {
    ctx.beginPath();  // Start a new path
    ctx.lineJoin = 'round';  // Make the join between line segments round
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.color;  // Set the color
    ctx.moveTo(x1, y1);  // Move the pen to the starting point
    ctx.lineTo(x2, y2);  // Draw a line to the ending point
    ctx.stroke();  // Render the line
  }

  reset(): void {
    // Nothing to reset for a circle brush
  }

  setColor(color: string): void {
    this.color = color;
  }

  setSize(size: number): void {
    this.size = size;
  }
}
