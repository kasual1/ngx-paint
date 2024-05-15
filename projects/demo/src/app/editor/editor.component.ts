import { Component, Input, ViewChild } from '@angular/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import {
  Brush,
  BrushPickerPanelComponent,
  CanvasComponent,
  ColorPickerComponent,
  ColorPickerPanelComponent,
  HistoryItem,
  StackEvent,
} from 'lib';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Location } from '@angular/common';
import { UuidService } from '../uuid.service';

interface Painting {
  id: string;
  title: string;
  canvas: {
    resolution: string;
    width: number;
    height: number;
  };
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CanvasComponent,
    ColorPickerComponent,
    ColorPickerPanelComponent,
    BrushPickerPanelComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
  ],
  providers: [Location],
  template: `
    @if(dbInitialized === true && painting !== undefined){

    <div class="top-panel">
      <mat-form-field>
        <mat-label>Title</mat-label>
        <input
          matInput
          [value]="painting.title"
          (input)="onTitleChange($event)"
        />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Select</mat-label>
        <mat-select
          [value]="painting.canvas.resolution"
          (selectionChange)="onResolutionChange($event)"
        >
          @for(resolution of resolutionOptions; track resolution.value){
          <mat-option value="{{ resolution.value }}">{{
            resolution.label
          }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <ngx-paint
      [undoStack]="undoStack"
      [width]="canvasWidth"
      [height]="canvasHeight"
      (historyChange)="onHistoryChange($event)"
      (redoStackChange)="onRedoStackChange($event)"
    ></ngx-paint>
    }
  `,
  styles: `
      :host {
      display: flex;
      justify-content: center;
      position: relative;
      height: 100%;
      width: 100%;
    }

    .top-panel{
      position: absolute;
      top: 0;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin: 12px;
    }
  `,
})
export class EditorComponent {
  @Input()
  id: string | null = null;

  @ViewChild(CanvasComponent)
  canvasComponent!: CanvasComponent;

  worker!: Worker;

  undoStack: HistoryItem[] = [];

  dbInitialized = false;

  painting: Painting = {
    id: this.uuidService.createUuid(),
    title: 'Untitled',
    canvas: {
      resolution: '800x600',
      width: 800,
      height: 600,
    },
  };

  resolutionOptions = [
    {
      label: '1920x1080',
      value: '1920x1080',
    },
    {
      label: '1280x720',
      value: '1280x720',
    },
    {
      label: '800x600',
      value: '800x600',
    },
    {
      label: 'Auto',
      value: 'auto',
    },
  ];

  get canvasWidth() {
    switch (this.painting.canvas.resolution) {
      case 'auto':
        return window.innerWidth;
      default:
        return parseInt(this.painting.canvas.resolution.split('x')[0]);
    }
  }

  get canvasHeight() {
    switch (this.painting.canvas.resolution) {
      case 'auto':
        return window.innerHeight;
      default:
        return parseInt(this.painting.canvas.resolution.split('x')[1]);
    }
  }

  constructor(private location: Location, private uuidService: UuidService) {
    this.initializeWorker();
  }

  initializeWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./editor.worker', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.postMessage({ type: 'initializeIndexedDB' });
    } else {
      throw new Error('Web Workers are not supported in this environment');
    }
  }

  handleMessage(event: MessageEvent) {
    switch (event.data.type) {
      case 'initializeIndexedDB':
        this.handleInitializeIndexedDB();
        break;
      case 'restoreHistory':
        this.handleRestoreHistory(event);
        break;
      case 'pushToHistory':
        this.handlePushToHistory(event);
        break;
      case 'popFromHistoryUntilHistoryItem':
        this.handlePopFromHistoryUntilHistoryItem(event);
        break;
      case 'savePainting':
        this.hanldeSavePainting(event);
        break;
      case 'restorePainting':
        this.handleRestorePainting(event);
        break;
    }
  }

  handleInitializeIndexedDB() {
    this.dbInitialized = true;
    if (this.id === undefined) {
      this.worker.postMessage({
        type: 'savePainting',
        painting: this.painting,
      });
    } else {
      this.worker.postMessage({
        type: 'restorePainting',
        id: this.id,
      });
    }
  }

  handleRestoreHistory(event: MessageEvent) {
    this.undoStack = event.data.historyItems;
    const mostRecentHistoryItem = this.undoStack[this.undoStack.length - 1];
    this.canvasComponent.drawImageDataToCanvas(mostRecentHistoryItem.snapshot);
    this.canvasComponent.brush = new Brush(
      'Brush',
      mostRecentHistoryItem.brushOptions
    );
    console.info(`Restored history in ${event.data.time}ms`);
  }

  handlePushToHistory(event: MessageEvent) {
    console.info('Pushed to history');
  }

  handlePopFromHistoryUntilHistoryItem(event: MessageEvent) {
    console.info('Popped from history');
  }

  hanldeSavePainting(event: MessageEvent) {
    this.painting = event.data.painting;
    this.location.replaceState(`/${this.painting.id}`);
  }

  handleRestorePainting(event: MessageEvent) {
    this.painting = event.data.painting;
    this.worker.postMessage({
      type: 'restoreHistory',
      painting: this.painting,
    });
  }

  onHistoryChange(event: StackEvent) {
    if (!this.dbInitialized) {
      return;
    }

    if (event.type === 'push') {
      this.worker.postMessage({
        type: 'pushToHistory',
        canvas: {
          width: this.canvasComponent?.canvas?.width ?? window.innerWidth,
          height: this.canvasComponent?.canvas?.height ?? window.innerHeight,
        },
        item: event.item,
        painting: this.painting
      });
    }
  }

  onRedoStackChange(event: StackEvent) {
    if (!this.dbInitialized) {
      return;
    }

    if (event.type === 'clear') {
      this.worker.postMessage({
        type: 'popFromHistoryUntilHistoryItem',
        item: event.item,
        painting: this.painting
      });
    }
  }

  onTitleChange(event: Event) {
    this.painting.title = (event.target as HTMLInputElement).value;
    this.worker.postMessage({
      type: 'savePainting',
      painting: this.painting,
    });
  }

  onResolutionChange(event: MatSelectChange) {
    this.painting.canvas.resolution = event.value;
    this.painting.canvas.width = event.value === 'auto' ? window.innerWidth : parseInt(event.value.split('x')[0]);
    this.painting.canvas.height = event.value === 'auto' ? window.innerHeight : parseInt(event.value.split('x')[1]);
    this.worker.postMessage({
      type: 'savePainting',
      painting: this.painting,
    });
  }
}
