import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
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

  @Output()
  undoStackChange = new EventEmitter<HistoryItem[]>();

  @Output()
  redoStackChange = new EventEmitter<HistoryItem[]>();

  @ViewChild('actionPanel')
  actionPanel!: ActionPanelComponent;

  @ViewChild('canvas')
  canvasRef!: ElementRef<HTMLCanvasElement>;

  canvas: HTMLCanvasElement | null = null;

  previousCanvas: HTMLCanvasElement | null = null;

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
    this.loadUndoStack();
  }

  private setupCanvas() {
    this.context = this.canvasRef.nativeElement.getContext('2d');
    this.canvas = this.canvasRef.nativeElement;
    this.pushToUndoStack({
      canvas: CanvasHelper.copyCanvas(this.canvas),
      brushOptions: {
        color: this.brush.color,
        size: this.brush.size,
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

      if(this.redoStack.length > 0){
        this.clearRedoStack();
        this.pushToUndoStack({
          canvas: CanvasHelper.copyCanvas(this.canvas!),
          brushOptions: {
            color: this.brush.color,
            size: this.brush.size,
          },
        });
      }
      this.previousCanvas = CanvasHelper.copyCanvas(this.canvas!);
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
    if (this.previousCanvas && this.canvas) {
      this.brush.up();
      this.mouseDown = false;

      this.pushToUndoStack({
        canvas: CanvasHelper.copyCanvas(this.canvas),
        brushOptions: {
          color: this.brush.color,
          size: this.brush.size,
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

  onBrushChange(brush: Brush) {
    this.brush = brush;
  }

  onColorChange(color: string) {
    this.brush.color = color;
  }

  onUndo() {
    if (this.undoStack.length > 0) {

      if(this.redoStack.length === 0){
        const lastItem = this.popFromUndoStack();
        this.pushToRedoStack(lastItem!);
      }

      const lastItem = this.popFromUndoStack();
      this.pushToRedoStack(lastItem!);

      this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      this.context!.drawImage(lastItem!.canvas, 0, 0);
      this.brush = new Brush('Brush', lastItem!.brushOptions);
    }
  }

  onRedo() {
    if (this.redoStack.length > 0) {

      if(this.undoStack.length === 0){
        const lastItem = this.popFromRedoStack();
        this.pushToUndoStack(lastItem!);
      }

      const lastItem = this.popFromRedoStack();
      this.pushToUndoStack(lastItem!);

      this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      this.context!.drawImage(lastItem!.canvas, 0, 0);
      this.brush = new Brush('Brush', lastItem!.brushOptions);
    }
  }

  pushToUndoStack(item: HistoryItem) {
    this.undoStack.push(item);
    this.undoStackChange.emit(this.undoStack);
  }

  pushToRedoStack(item: HistoryItem) {
    this.redoStack.push(item);
    this.redoStackChange.emit(this.redoStack);
  }

  popFromUndoStack(): HistoryItem | undefined{
    const item = this.undoStack.pop();
    this.undoStackChange.emit(this.undoStack);
    return item;
  }

  popFromRedoStack(): HistoryItem | undefined{
    const item = this.redoStack.pop();
    this.redoStackChange.emit(this.redoStack);
    return item;
  }

  clearUndoStack() {
    this.undoStack = [];
    this.undoStackChange.emit(this.undoStack);
  }

  clearRedoStack() {
    this.redoStack = [];
    this.redoStackChange.emit(this.redoStack);
  }

  getArrayByteSize(array: PixelDiff[]): number {
    const sizeInBytes = array.length;
    const sizeInMegabytes = (sizeInBytes * 6) / 8 / 1024 / 1024;
    return sizeInMegabytes;
  }

  calculateCanvasDiff(
    oldCanvas: HTMLCanvasElement,
    newCanvas: HTMLCanvasElement
  ): PixelDiff[] {
    const oldContext = oldCanvas.getContext('2d')!;
    const newContext = newCanvas.getContext('2d')!;

    const oldImageData = oldContext.getImageData(
      0,
      0,
      oldCanvas.width,
      oldCanvas.height
    );
    const newImageData = newContext.getImageData(
      0,
      0,
      newCanvas.width,
      newCanvas.height
    );

    const pixelDiffs: PixelDiff[] = [];

    for (let y = 0; y < oldCanvas.height; y++) {
      for (let x = 0; x < oldCanvas.width; x++) {
        const index = (y * oldCanvas.width + x) * 4;

        const oldPixel = oldImageData.data.slice(index, index + 4);
        const newPixel = newImageData.data.slice(index, index + 4);

        if (oldPixel.join(',') !== newPixel.join(',')) {
          const [r, g, b, a] = newPixel;
          const alpha = a / 255; // Normalize alpha to 0-1 range
          pixelDiffs.push({
            x,
            y,
            color: `rgba(${r},${g},${b},${alpha})`,
          });
        }
      }
    }

    return pixelDiffs;
  }

  applyCanvasDiff(context: CanvasRenderingContext2D, diffs: PixelDiff[]) {
    for (const dif of diffs) {
      context.fillStyle = dif.color;
      context.fillRect(dif.x, dif.y, 1, 1);
    }
  }

  saveUndoStack() {
    const simplifiedUndoStack = this.undoStack.map(item => ({
      brushOptions: item.brushOptions
    }));

    localStorage.setItem('undoStack', JSON.stringify(simplifiedUndoStack));
  }

  loadUndoStack() {
    const savedUndoStack = localStorage.getItem('undoStack');

    if (savedUndoStack) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.width = this.canvas!.width;
      canvas.height = this.canvas!.height;

      this.undoStack = JSON.parse(savedUndoStack).map((item: any) => {
        this.applyCanvasDiff(context!, item.diffs);

        return {
          canvas: CanvasHelper.copyCanvas(canvas),
          diffs: item.diffs,
          brushOptions: item.brushOptions
        };
      });

      // Restore the canvas state to the last item in the undo stack
      if (this.undoStack.length > 0) {
        const lastItem = this.undoStack[this.undoStack.length - 1];
        this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
        this.context!.drawImage(lastItem.canvas, 0, 0);
        this.brush = new Brush('Brush', lastItem.brushOptions);
      }
    }
  }

}

export interface HistoryItem {
  canvas: HTMLCanvasElement;
  brushOptions: BrushOptions;
}

export interface PixelDiff {
  x: number;
  y: number;
  color: string;
}
