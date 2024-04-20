import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { LineBrush } from '../brushes/line-brush.class';
import { FormsModule } from '@angular/forms';
import { Brush } from '../brushes/brush.model';

@Component({
  selector: 'ngx-paint-brush-picker-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <canvas #previewCanvas></canvas>

    <form #ngForm>
    <div class="action-panel">
      <input
        type="range"
        min="1"
        max="50"
        name="size"
        [(ngModel)]="brush.size"
        (ngModelChange)="onFormChange()"
      />
    </div>
  </form>
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
      border-radius: 4px 4px 0 0;
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
  @Input()
  brush: Brush = new LineBrush('#000000', 10);

  @ViewChild('previewCanvas')
  canvasRef!: ElementRef<HTMLCanvasElement>;

  canvas!: HTMLCanvasElement;

  context!: CanvasRenderingContext2D;

  color: string = '#000000';

  lineWidth: number = 10;

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.context = this.canvas.getContext('2d')!;
    this.canvas.width = 300;
    this.canvas.height = 100

    this.drawPreviewStrokeOnCanvas();
  }


  private drawPreviewStrokeOnCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.beginPath();
    this.context.moveTo(10, 40);
    this.context.bezierCurveTo(100, 10, 200, 90, 290, 50);
    this.context.lineWidth = this.brush.size;
    this.context.strokeStyle = this.brush.color;
    this.context.stroke();
  }

  onFormChange() {
    this.drawPreviewStrokeOnCanvas();
  }
}
