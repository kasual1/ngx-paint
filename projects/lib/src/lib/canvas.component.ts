import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Brush } from './brushes/brush.model';
import { LineBrush } from './brushes/line-brush.class';
import { ActionPanelComponent } from './action-panel.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ngx-paint',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [ActionPanelComponent, CommonModule],
  template: `
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300"
      rel="stylesheet"
    />

    <canvas #canvas></canvas>

    <ngx-paint-action-panel
      #actionPanel
      [brush]="selectedBrush"
      (colorChange)="onColorChange($event)"
      (redo)="onRedo()"
      (undo)="onUndo()"
    ></ngx-paint-action-panel>

    <div class="debug-panel">
      <h1>Debug panel</h1>
      <pre>Undo Stack:{{ undoStack.length | json }}</pre>
      <pre>Redo Stack:{{ redoStack.length | json }}</pre>
    </div>
  `,
  styles: `
    canvas {
      display: block;
    }

    ngx-paint-action-panel{
      position: fixed;
      top: 0;
      left: 0;
    }

    .debug-panel{
      position: fixed;
      bottom: 0;
      left: 0;
      background-color: white;
      padding: 12px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `,
})
export class CanvasComponent implements AfterViewInit {
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    this.resizeCanvas();
  }

  @ViewChild('actionPanel')
  actionPanel!: ActionPanelComponent;

  @ViewChild('canvas')
  canvasRef!: ElementRef<HTMLCanvasElement>;

  canvas: HTMLCanvasElement | null = null;

  context: CanvasRenderingContext2D | null = null;

  lineBrush: Brush = new LineBrush('black', 10);

  selectedBrush: Brush = this.lineBrush;

  currentPolyline: { x: number; y: number, color: string }[] = [];

  undoStack: any[] = [];
  redoStack: any[] = [];

  ngAfterViewInit() {
    this.setupCanvas();
    this.setupEventListeners();
    this.resizeCanvas();
  }

  private setupCanvas() {
    this.context = this.canvasRef.nativeElement.getContext('2d');
    this.canvas = this.canvasRef.nativeElement;
  }

  private setupEventListeners() {
    if (this.canvas) {
      this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
      this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
      this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    }
  }

  private resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  onMouseDown(event: MouseEvent) {
    if (this.context && this.actionPanel.active === false) {
      const x = event.clientX - this.canvasRef.nativeElement.offsetLeft;
      const y = event.clientY - this.canvasRef.nativeElement.offsetTop;
      this.currentPolyline.push({ x, y, color: this.selectedBrush.color });
      this.selectedBrush.draw(this.context, x, y);
    }
  }

  onMouseMove(event: MouseEvent) {
    if (event.buttons === 1 && this.context && this.actionPanel.active === false) {
      const x = event.clientX - this.canvasRef.nativeElement.offsetLeft;
      const y = event.clientY - this.canvasRef.nativeElement.offsetTop;
      this.currentPolyline.push({ x, y, color: this.selectedBrush.color });
      this.selectedBrush.draw(this.context, x, y);
    }
  }

  onMouseUp(event: MouseEvent) {
    if (this.currentPolyline) {
      this.selectedBrush.reset();
      this.undoStack.push(this.currentPolyline);
      this.currentPolyline = [];
    }
  }

  setSelectedBrush(brush: Brush) {
    this.selectedBrush = brush;
  }

  onColorChange(color: string) {
    this.selectedBrush.setColor(color);
  }

  onUndo() {
    if (this.undoStack.length > 0) {
      const lastPolyline = this.undoStack.pop();
      this.redoStack.push(lastPolyline);
      this.redrawCanvas();
      this.selectedBrush.reset();
    }
  }

  onRedo() {
    if (this.redoStack.length > 0) {
      const lastPolyline = this.redoStack.pop();
      this.undoStack.push(lastPolyline);
      this.redrawCanvas();
    }
  }

  private redrawCanvas() {
    this.canvas = this.canvasRef.nativeElement;
    this.context!.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const polyline of this.undoStack) {
      for (let i = 0; i < polyline.length; i++) {
        this.selectedBrush.setColor(polyline[i].color);
        this.selectedBrush.draw(this.context!, polyline[i].x, polyline[i].y);
      }
      this.selectedBrush.reset();
    }
  }
}
