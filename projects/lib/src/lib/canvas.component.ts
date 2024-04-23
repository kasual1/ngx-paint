import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Brush, BrushType } from './brushes/brush.model';
import { LineBrush } from './brushes/line-brush.class';
import { ActionPanelComponent } from './action-panel.component';
import { CommonModule } from '@angular/common';
import { BasicBrush, CircleBrush } from '../public-api';

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

    <div
      class="cursor-circle"
      [ngStyle]="cursorCircleStyle"
      [hidden]="!cursorCircleVisible || actionPanel.active"
    ></div>

    <canvas #canvas></canvas>

    <ngx-paint-action-panel
      #actionPanel
      [brush]="selectedBrush"
      (brushChange)="onBrushChange($event)"
      (colorChange)="onColorChange($event)"
      (redo)="onRedo()"
      (undo)="onUndo()"
      (mouseenter)="onMouseEnterActionPanel()"
      (mouseleave)="onMouseLeaveActionPanel()"
    ></ngx-paint-action-panel>

    <div class="debug-panel">
      <h1>Debug panel</h1>
      <pre>Undo Stack:{{ undoStack.length | json }}</pre>
      <pre>Redo Stack:{{ redoStack.length | json }}</pre>
      <pre>Cursor X: {{ cursorX }}</pre>
      <pre>Cursor Y: {{ cursorY }}</pre>
      <pre>Window Width: {{ windowWidth }}</pre>
      <pre>Window Height: {{ windowHeight }}</pre>
      <pre>Selected Brush: {{ selectedBrush.name }}</pre>
      <pre>Selected Brush Size: {{ selectedBrush.size }}</pre>
    </div>
  `,
  styles: `
    .cursor-circle {
      position: absolute;
      border: 1px solid rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: width 0.1s ease, height 0.1s ease;
      background-color: rgba(240, 240, 240, 0.25);
    }

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
      background-color: rgba(240, 240, 240, 0.85);
      backdrop-filter: blur(10px);
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

  selectedBrush: Brush = new CircleBrush('Circle', '#eb4034', 20);

  currentPolyline: {
    x: number;
    y: number;
    prevX?: number;
    prevY?: number;
    type: BrushType;
    color: string;
    size: number;
  }[] = [];

  undoStack: any[] = [];
  redoStack: any[] = [];

  cursorX = 0;
  cursorY = 0;

  cursorCircleVisible = true;

  mouseDown = false;

  get cursorCircleStyle() {
    return {
      'top.px': this.cursorY,
      'left.px': this.cursorX,
      'width.px': this.selectedBrush.size,
      'height.px': this.selectedBrush.size,
      'border-color': this.mouseDown
        ? this.selectedBrush.color
        : 'rgba(240, 240, 240, 0.5)',
    };
  }

  get windowWidth() {
    return window.innerWidth;
  }

  get windowHeight() {
    return window.innerHeight;
  }

  ngAfterViewInit() {
    this.setupCanvas();
    this.setupEventListeners();
    this.resizeCanvas();
  }

  private updateCursorCirclePosition(event: MouseEvent) {
    const circleRadius = this.selectedBrush.size / 2;
    const circleBorder = 1;

    this.cursorX = Math.min(
      Math.max(event.clientX, circleRadius),
      window.innerWidth - circleRadius - circleBorder
    );
    this.cursorY = Math.min(
      Math.max(event.clientY, circleRadius),
      window.innerHeight - circleRadius - circleBorder
    );
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
      this.currentPolyline.push({
        x,
        y,
        prevX: (this.selectedBrush as LineBrush).prevX!,
        prevY: (this.selectedBrush as LineBrush).prevY!,
        type: this.selectedBrush.type,
        color: this.selectedBrush.color,
        size: this.selectedBrush.size,
      });
      this.selectedBrush.down(x, y);
    }

    this.mouseDown = true;
  }

  onMouseMove(event: MouseEvent) {
    if (
      this.mouseDown &&
      this.context &&
      this.actionPanel.active === false
    ) {
      const x = event.clientX - this.canvasRef.nativeElement.offsetLeft;
      const y = event.clientY - this.canvasRef.nativeElement.offsetTop;
      this.currentPolyline.push({
        x,
        y,
        prevX: (this.selectedBrush as LineBrush).prevX!,
        prevY: (this.selectedBrush as LineBrush).prevY!,
        type: this.selectedBrush.type,
        color: this.selectedBrush.color,
        size: this.selectedBrush.size,
      });
      this.selectedBrush.draw(this.context, x, y);
    }

    this.updateCursorCirclePosition(event);
  }

  onMouseUp(event: MouseEvent) {
    if (this.currentPolyline.length > 0) {
      this.selectedBrush.reset();
      this.undoStack.push(this.currentPolyline);
      this.currentPolyline = [];
    }

    this.selectedBrush.up();
    this.mouseDown = false;
  }

  onBrushChange(brush: Brush) {
    brush.setSize(this.selectedBrush.size);
    brush.setColor(this.selectedBrush.color);
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
        this.selectedBrush = this.createBrush(polyline[i].type, polyline[i].color, polyline[i].size);
        if(this.selectedBrush.type === BrushType.Line){
          (this.selectedBrush as LineBrush).prevX = polyline[i].prevX;
          (this.selectedBrush as LineBrush).prevY = polyline[i].prevY;
        }
        this.selectedBrush.draw(this.context!, polyline[i].x, polyline[i].y);
      }
      this.selectedBrush.reset();
    }
  }

  onMouseEnterActionPanel() {
    this.cursorCircleVisible = false;
  }

  onMouseLeaveActionPanel() {
    this.cursorCircleVisible = true;
  }

  private createBrush(type: BrushType, color: string, size: number) {
    switch (type) {
      case BrushType.Circle:
        return new CircleBrush('Circle', color, size);
      case BrushType.Basic:
        return new BasicBrush('Basic', color, size);
      case BrushType.Line:
        return new LineBrush('Line', color, size);
      default:
        throw new Error('Brush type not supported');
    }
  }
}
