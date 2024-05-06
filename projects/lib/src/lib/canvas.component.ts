import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActionPanelComponent } from './action-panel.component';
import { CommonModule } from '@angular/common';
import { Brush, BrushOptions } from './brushes/brush.class';
import { CanvasHelper } from './helper/canvas.helper';
import { CursorService } from './cursor.service';

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
      [hidden]="!cursorService.cursorCircleVisible || actionPanel.active"
    ></div>

    <canvas #canvas></canvas>

    <ngx-paint-action-panel
      #actionPanel
      [brush]="brush"
      (brushChange)="onBrushChange($event)"
      (colorChange)="onColorChange($event)"
      (redo)="onRedo()"
      (undo)="onUndo()"
      (mouseenter)="onMouseEnterActionPanel()"
      (mouseleave)="onMouseLeaveActionPanel()"
    ></ngx-paint-action-panel>

    <div class="debug-panel">
      <h1>Debug panel</h1>
      <pre>Undo Stack: {{ undoStack.length }}</pre>
      <pre>Redo Stack: {{ redoStack.length }}</pre>
      <pre>Window Width: {{ windowWidth }}</pre>
      <pre>Window Height: {{ windowHeight }}</pre>
      <pre>Selected Brush: {{ brush.name }}</pre>
      <pre>Selected Brush Size: {{ brush.size }}</pre>
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

  brush: Brush = new Brush('Brush', {
    color: '#eb4034',
    size: 20,
  });

  mouseDown = false;

  undoStack: HistoryItem[] = [];

  redoStack: HistoryItem[] = [];

  get cursorCircleStyle() {
    return this.cursorService.getCursorCircleStyle(this.brush, this.mouseDown);
  }

  get windowWidth() {
    return window.innerWidth;
  }

  get windowHeight() {
    return window.innerHeight;
  }

  get canDraw() {
    return this.context && this.actionPanel.active === false;
  }

  constructor(public cursorService: CursorService) {}

  ngAfterViewInit() {
    this.setupCanvas();
    this.setupEventListeners();
    this.resizeCanvas();
  }

  private setupCanvas() {
    this.context = this.canvasRef.nativeElement.getContext('2d');
    this.canvas = this.canvasRef.nativeElement;
    this.undoStack.push({
      canvas: CanvasHelper.copyCanvas(this.canvas!),
      brushOptions: {
        size: this.brush.size,
        color: this.brush.color,
      },
    });
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
    if (this.canDraw) {
      const x = event.clientX - this.canvasRef.nativeElement.offsetLeft;
      const y = event.clientY - this.canvasRef.nativeElement.offsetTop;
      this.brush.down(x, y);
    }

    this.mouseDown = true;
  }

  onMouseMove(event: MouseEvent) {
    if (this.mouseDown && this.canDraw) {
      const x = event.clientX - this.canvasRef.nativeElement.offsetLeft;
      const y = event.clientY - this.canvasRef.nativeElement.offsetTop;
      this.brush.draw(this.context!, x, y);
    }

    this.cursorService.updateCursorCirclePosition(
      this.brush.size / 2,
      1,
      event
    );
  }

  onMouseUp(event: MouseEvent) {
    if (this.canvas) {
      this.brush.up();
      this.mouseDown = false;
      this.undoStack.push({
        canvas: CanvasHelper.copyCanvas(this.canvas),
        brushOptions: {
          size: this.brush.size,
          color: this.brush.color,
        },
      });
    }
  }

  onMouseEnterActionPanel() {
    this.cursorService.cursorCircleVisible = false;
  }

  onMouseLeaveActionPanel() {
    this.cursorService.cursorCircleVisible = true;
  }

  onBrushChange(options: BrushOptions) {
    this.brush.color = options.color!;
    this.brush.size = options.size;
  }

  onColorChange(color: string) {
    this.brush.color = color;
  }

  onUndo() {
    if (this.redoStack.length === 0) {
      const mostCurrentHistoryItem = this.undoStack.pop();
      if (mostCurrentHistoryItem) {
        this.redoStack.push(mostCurrentHistoryItem);
      }
    }

    const historyItem = this.undoStack.pop();
    if (historyItem) {
      this.redoStack.push(historyItem);
      this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      this.context!.drawImage(historyItem.canvas, 0, 0);
    }
  }

  onRedo() {
    if (this.undoStack.length === 0) {
      const mostCurrentHistoryItem = this.redoStack.pop();
      if (mostCurrentHistoryItem) {
        this.undoStack.push(mostCurrentHistoryItem);
      }
    }

    const historyItem = this.redoStack.pop();
    if (historyItem) {
      this.undoStack.push(historyItem);
      this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      this.context!.drawImage(historyItem.canvas, 0, 0);
    }
  }
}

export interface HistoryItem {
  canvas: HTMLCanvasElement;
  brushOptions: BrushOptions;
}
