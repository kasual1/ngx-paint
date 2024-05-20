import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActionPanelComponent } from './action-panel.component';
import { CommonModule } from '@angular/common';
import { Brush, BrushOptions } from './brushes/brush.class';
import { CanvasHelper } from './helper/canvas.helper';
import { CursorService } from './cursor.service';
import { ZoomControlsComponent } from './zoom-controls.component';
import { NotificationComponent } from './notification/notification.component';
import { NotificationService } from './notification/notification.service';
import { NotificationDirective } from './notification/notification.directive';

@Component({
  selector: 'ngx-paint',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [ActionPanelComponent, ZoomControlsComponent, NotificationComponent, NotificationDirective, CommonModule],
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

    <ngx-paint-zoom-controls
      (zoomIn)="onZoomIn()"
      (zoomOut)="onZoomOut()"
    ></ngx-paint-zoom-controls>

    <div ngxPaintNotification></div>
  `,
  styles: `

    ngx-paint {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
      background-color: #EBF0F8;
    }

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
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    }

    ngx-paint-action-panel{
      position: fixed;
      top: 0;
      left: 0;
    }

    ngx-paint-zoom-controls {
      position: fixed;
      bottom: 0;
      left: 0;
      margin: 12px;
    }
  `,
})
export class CanvasComponent implements AfterViewInit, OnChanges {
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.canvas) {
        // Calculate the zoom factor to fit the canvas on the screen
        const zoomFactorX = window.innerWidth / this.canvas.width;
        const zoomFactorY = window.innerHeight / this.canvas.height;
        this.zoomFactor = Math.min(zoomFactorX, zoomFactorY);

        // Adjust the canvas size
        this.canvas.width = this.canvas.width * this.zoomFactor;
        this.canvas.height = this.canvas.height * this.zoomFactor;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '50%';
        this.canvas.style.top = '50%';
        this.canvas.style.transform = 'translate(-50%, -50%)';
        this.applyZoom();
      }
    }, 50);
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    this.onWheelZoom(event);
  }

  @Input()
  undoStack: HistoryItem[] = [];

  @Input()
  redoStack: HistoryItem[] = [];

  @Input()
  width = window.innerWidth;

  @Input()
  height = window.innerHeight;

  @Output()
  undoStackChange = new EventEmitter<StackEvent>();

  @Output()
  redoStackChange = new EventEmitter<StackEvent>();

  @Output()
  historyChange = new EventEmitter<StackEvent>();

  @ViewChild('actionPanel')
  actionPanel!: ActionPanelComponent;

  @ViewChild('canvas')
  canvasRef!: ElementRef<HTMLCanvasElement>;

  canvas: HTMLCanvasElement | null = null;

  previousCanvas: HTMLCanvasElement | null = null;

  currentImageData: ImageData | null = null;

  context: CanvasRenderingContext2D | null = null;

  brush: Brush = new Brush('Brush', {
    color: '#eb4034',
    size: 20,
  });

  mouseDown = false;

  lastUndoRedoAction: 'undo' | 'redo' | null = null;

  zoomFactor = 1.0;

  zoomSpeed = 0.1;

  originalWidth = this.width;

  originalHeight = this.height;

  resizeTimeout: any;

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

  constructor(public cursorService: CursorService, private notificationService: NotificationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['width'] || changes['height']) {
      this.resizeCanvas();
      this.fillCanvasWithWhite();
    }
  }

  ngAfterViewInit() {
    this.setupCanvas();
    this.resizeCanvas();
    this.fillCanvasWithWhite();
  }

  private setupCanvas() {
    this.context = this.canvasRef.nativeElement.getContext('2d');
    this.canvas = this.canvasRef.nativeElement;
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  private fillCanvasWithWhite() {
    if (this.context && this.canvas) {
      this.canvas.style.backgroundColor = 'white';
      this.context.fillStyle = 'white';
      this.context.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
    }
  }

  onMouseDown(event: MouseEvent) {
    if (this.canDraw) {
      if (this.redoStack.length > 0) {
        this.clearRedoStack();

        const historyItem = {
          timestamp: new Date(),
          snapshot: this.canvas!.getContext('2d')!.getImageData(
            0,
            0,
            this.canvas!.width,
            this.canvas!.height
          ),
          brushOptions: {
            color: this.brush.color,
            size: this.brush.size,
          },
        };

        this.pushToUndoStack(historyItem);
      }

      if (this.undoStack.length === 0 && this.redoStack.length === 0) {
        this.addBlankCanvasToUndoStack();
      }

      this.previousCanvas = CanvasHelper.copyCanvas(this.canvas!);
      const x =
        (event.clientX - this.canvasRef.nativeElement.offsetLeft) /
        this.zoomFactor;
      const y =
        (event.clientY - this.canvasRef.nativeElement.offsetTop) /
        this.zoomFactor;
      this.brush.down(x, y);
    }

    this.mouseDown = true;
  }

  onMouseMove(event: MouseEvent) {
    if (this.mouseDown && this.canDraw) {
      const x =
        (event.clientX - this.canvasRef.nativeElement.offsetLeft) /
        this.zoomFactor;
      const y =
        (event.clientY - this.canvasRef.nativeElement.offsetTop) /
        this.zoomFactor;
      this.brush.draw(this.context!, x, y);
    }

    this.cursorService.updateCursorCirclePosition(
      this.brush.size / 2,
      1,
      event
    );
  }

  onMouseUp(event: MouseEvent) {
    if (this.previousCanvas && this.canvas) {
      this.brush.up();
      this.mouseDown = false;

      const historyItem = {
        timestamp: new Date(),
        snapshot: this.canvas!.getContext('2d')!.getImageData(
          0,
          0,
          this.canvas!.width,
          this.canvas!.height
        ),
        brushOptions: {
          color: this.brush.color,
          size: this.brush.size,
        },
      };
      this.pushToUndoStack(historyItem);
      this.historyChange.emit({ type: 'push', item: historyItem });
    }
  }

  onMouseEnterActionPanel() {
    this.cursorService.cursorCircleVisible = false;
  }

  onMouseLeaveActionPanel() {
    this.cursorService.cursorCircleVisible = true;
  }

  onBrushChange(brush: Brush) {
    this.brush = brush;
  }

  onColorChange(color: string) {
    this.brush.color = color;
  }

  onUndo() {
    if (this.undoStack.length > 0) {
      if (
        this.lastUndoRedoAction === 'redo' ||
        this.lastUndoRedoAction === null
      ) {
        const lastItem = this.popFromUndoStack();
        this.pushToRedoStack(lastItem!);
      }

      const lastItem = this.popFromUndoStack();
      this.pushToRedoStack(lastItem!);

      this.drawImageDataToCanvas(lastItem!.snapshot);
      this.brush = new Brush('Brush', lastItem!.brushOptions);

      this.lastUndoRedoAction = 'undo';
    }
  }

  onRedo() {
    if (this.redoStack.length > 0) {
      if (
        this.lastUndoRedoAction === 'undo' ||
        this.lastUndoRedoAction === null
      ) {
        const lastItem = this.popFromRedoStack();
        this.pushToUndoStack(lastItem!);
      }

      const lastItem = this.popFromRedoStack();
      this.pushToUndoStack(lastItem!);

      this.drawImageDataToCanvas(lastItem!.snapshot);
      this.brush = new Brush('Brush', lastItem!.brushOptions);

      this.lastUndoRedoAction = 'redo';
    }
  }

  drawImageDataToCanvas(imageData: ImageData) {
    if (this.context && this.canvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.putImageData(imageData, 0, 0);
    }
  }

  addBlankCanvasToUndoStack() {
    const historyItem = {
      timestamp: new Date(),
      snapshot: this.canvas!.getContext('2d')!.getImageData(
        0,
        0,
        this.canvas!.width,
        this.canvas!.height
      ),
      brushOptions: {
        color: this.brush.color,
        size: this.brush.size,
      },
    };
    this.pushToUndoStack(historyItem);
    this.historyChange.emit({ type: 'push', item: historyItem });
  }

  clearCanvas() {
    if (this.context && this.canvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  pushToUndoStack(item: HistoryItem) {
    this.undoStack.push(item);
    this.undoStackChange.emit({ type: 'push', item: item });
  }

  pushToRedoStack(item: HistoryItem) {
    this.redoStack.push(item);
    this.redoStackChange.emit({ type: 'push', item: item });
  }

  popFromUndoStack(): HistoryItem | undefined {
    const item = this.undoStack.pop();
    this.undoStackChange.emit({ type: 'pop', item: item });
    return item;
  }

  popFromRedoStack(): HistoryItem | undefined {
    const item = this.redoStack.pop();
    this.redoStackChange.emit({ type: 'pop', item: item });
    return item;
  }

  clearUndoStack() {
    this.undoStack = [];
    this.undoStackChange.emit({ type: 'clear', item: undefined });
  }

  clearRedoStack() {
    const lastItem = this.redoStack[this.redoStack.length - 1];
    this.redoStack = [];
    this.redoStackChange.emit({ type: 'clear', item: lastItem });
    this.lastUndoRedoAction = null;
  }

  onWheelZoom(event: WheelEvent) {
    if (event.ctrlKey && event.deltaMode === 0 && event.deltaX === 0) {
      event.preventDefault();
      if (event.deltaY > 0) {
        this.onZoomOut();
      } else {
        this.onZoomIn();
      }
    }
  }

  onZoomIn() {
    this.zoomFactor += this.zoomSpeed;
    this.applyZoom();
    this.notificationService.notify(`Zoom: ${Math.round(this.zoomFactor * 100)}%`);
  }

  onZoomOut() {
    this.zoomFactor -= this.zoomSpeed;
    this.applyZoom();
    this.notificationService.notify(`Zoom: ${Math.round(this.zoomFactor * 100)}%`);
  }

  applyZoom() {
    if (this.canvas && this.context) {
      this.zoomFactor = Math.max(0.1, Math.min(5.0, this.zoomFactor));

      if (this.currentImageData === null) {
        this.currentImageData = this.context!.getImageData(
          0,
          0,
          this.canvas!.width,
          this.canvas!.height
        );

        this.originalWidth = this.canvas!.width;
        this.originalHeight = this.canvas!.height;
      }

      this.canvas!.width = this.originalWidth * this.zoomFactor;
      this.canvas!.height = this.originalHeight * this.zoomFactor;

      this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);

      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.scale(this.zoomFactor, this.zoomFactor);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas!.width;
      tempCanvas.height = this.canvas!.height;

      tempCanvas.getContext('2d')!.putImageData(this.currentImageData, 0, 0);

      this.context.drawImage(
        tempCanvas,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height,
        0,
        0,
        this.canvas!.width,
        this.canvas!.height
      );
    }
  }
}

export interface HistoryItem {
  timestamp: Date;
  snapshot: ImageData;
  brushOptions: BrushOptions;
}

export interface StackEvent {
  type: 'push' | 'pop' | 'clear';
  item: HistoryItem | undefined;
}
