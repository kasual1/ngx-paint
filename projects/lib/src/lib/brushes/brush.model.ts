export enum BrushType {
  Circle = 'Circle',
  Line = 'Line',
  Basic = 'Basic',
}

export interface Brush {
  name: string;
  type: BrushType;
  icon: string;
  color: string;
  size: number;
  reset(): void;
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
  setColor(color: string): void;
  setSize(size: number): void;
}

