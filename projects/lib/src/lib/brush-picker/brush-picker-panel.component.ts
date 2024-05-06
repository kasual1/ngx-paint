import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { BrushPickerSelectComponent } from './brush-picker-select.component';
import { Brush } from '../brushes/brush.class';
@Component({
  selector: 'ngx-paint-brush-picker-panel',
  standalone: true,
  imports: [BrushPickerSelectComponent],
  template: `
    <ngx-paint-brush-picker-select
      [brush]="brush"
      [brushOptions]="brushOptions"
      (brushChange)="onBrushChange($event)"
    ></ngx-paint-brush-picker-select>

    <canvas #previewCanvas></canvas>

    <div class="action-panel">
      <input
        type="range"
        min="1"
        max="50"
        [value]="brush.size"
        (input)="onBrushSizeChange($event)"
      />
    </div>
  `,
  styles: `
    :host{
      display: flex;
      flex-direction: column;
      width: 300px;
      border-radius: 4px;
      background-color: rgba(240, 240, 240, 0.85);
      backdrop-filter: blur(10px);
    }

    canvas {
      background-color: white;
    }

    .action-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border-radius: 0 0 4px 4px;
    }
  `,
})
export class BrushPickerPanelComponent implements AfterViewInit {
  @Input({ required: true })
  brush!: Brush;

  @Input({ required: true })
  brushOptions!: Brush[];

  @Output()
  brushChange = new EventEmitter<Brush>();

  @ViewChild('previewCanvas')
  canvasRef!: ElementRef<HTMLCanvasElement>;

  canvas!: HTMLCanvasElement;

  context!: CanvasRenderingContext2D;

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.context = this.canvas.getContext('2d')!;
    this.canvas.width = 300;
    this.canvas.height = 100;
    this.drawPreviewStrokeOnCanvas();
  }

  onBrushChange(brush: Brush) {
    this.brush = brush;
    this.drawPreviewStrokeOnCanvas();
    this.brushChange.emit(brush);
  }

  onBrushSizeChange(event: Event) {
    const size = (event.target as HTMLInputElement).value;
    this.brush.size = parseInt(size);
    this.drawPreviewStrokeOnCanvas();
    this.brushChange.emit(this.brush);
  }

  private drawPreviewStrokeOnCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const points = this.calculateBezierCurve(10, 40, 100, 10, 200, 90, 290, 50, 100);

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (i === 0) {
        this.brush.down(point.x, point.y);
      }
      this.brush.draw(this.context, point.x, point.y);
    }
    this.brush.up();
  }

  private calculateBezierCurve(x1: number, y1: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x2: number, y2: number, steps: number): {x: number, y: number}[] {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (1 - t) ** 3 * x1 + 3 * (1 - t) ** 2 * t * cp1x + 3 * (1 - t) * t ** 2 * cp2x + t ** 3 * x2;
      const y = (1 - t) ** 3 * y1 + 3 * (1 - t) ** 2 * t * cp1y + 3 * (1 - t) * t ** 2 * cp2y + t ** 3 * y2;
      points.push({x, y});
    }
    return points;
  }
}
