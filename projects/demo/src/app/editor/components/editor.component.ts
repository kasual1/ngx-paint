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
import { UuidService } from '../../uuid.service';
import { HistoryCompletion } from '../enums/history-completion.enum';
import { PaintingCompletion } from '../enums/painting-completion.enum copy';
import { PaintingAction } from '../enums/painting-action.enum copy';
import { HistoryAction } from '../enums/history-action.enum';

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
  id: string | undefined;

  @ViewChild(CanvasComponent)
  canvasComponent!: CanvasComponent;

  historyWorker!: Worker;

  paintingWorker!: Worker;

  undoStack: HistoryItem[] = [];

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
    this.initializeWorkers();
  }

  initializeWorkers() {
    if (typeof Worker !== 'undefined') {
      this.initializeHistoryWorker();
      this.initializePaintingWorker();
    } else {
      throw new Error('Web Workers are not supported in this environment');
    }
  }

  initializeHistoryWorker() {
    this.historyWorker = new Worker(
      new URL('../workers/history.worker', import.meta.url),
      {
        type: 'module',
      }
    );

    const historyCompletionHandlers: {
      [key in HistoryCompletion]: (event: MessageEvent) => void;
    } = {
      [HistoryCompletion.Initialized]: () => {},
      [HistoryCompletion.RestoredHistory]: this.handleRestoredHistory.bind(this),
      [HistoryCompletion.PushedToHistory]: () => {},
      [HistoryCompletion.PoppedFromHistoryUntilHistoryItem]: () => {},
    };

    this.historyWorker.onmessage = (event: MessageEvent) => {
      const handler =
        historyCompletionHandlers[event.data.type as HistoryCompletion];
      if (handler) {
        handler(event);
      } else {
        console.error(`No handler for message type "${event.data.type}"`);
      }
    };

    this.historyWorker.postMessage({
      type: HistoryAction.Initialize,
    });
  }

  initializePaintingWorker() {
    this.paintingWorker = new Worker(
      new URL('../workers/painting.worker', import.meta.url),
      {
        type: 'module',
      }
    );

    const paintingCompletionHandlers: {
      [key in PaintingCompletion]: (event: MessageEvent) => void;
    } = {
      [PaintingCompletion.Initialized]: this.handlePaintingWorkerInitialized.bind(this),
      [PaintingCompletion.SavedPainting]: this.handleSavedPainting.bind(this),
      [PaintingCompletion.RestoredPainting]:
        this.handleRestoredPainting.bind(this),
    };

    this.paintingWorker.onmessage = (event: MessageEvent) => {
      const handler =
        paintingCompletionHandlers[event.data.type as PaintingCompletion];
      if (handler) {
        handler(event);
      } else {
        console.error(`No handler for message type "${event.data.type}"`);
      }
    };

    this.paintingWorker.postMessage({
      type: PaintingAction.Initialize,
    });
  }

  handlePaintingWorkerInitialized() {
    if (this.id === undefined) {
      this.paintingWorker.postMessage({
        type: PaintingAction.SavePainting,
        painting: this.painting,
      });
    } else {
      this.paintingWorker.postMessage({
        type: PaintingAction.RestorePainting,
        id: this.id,
      });
    }
  }

  handleSavedPainting(event: MessageEvent) {
    this.location.replaceState(`/${event.data.id}`);
  }

  handleRestoredPainting(event: MessageEvent) {
    this.painting = event.data.painting;
    this.historyWorker.postMessage({
      type: HistoryAction.RestoreHistory,
      painting: this.painting,
    });
  }

  onTitleChange(event: Event) {
    this.painting.title = (event.target as HTMLInputElement).value;
    this.paintingWorker.postMessage({
      type: PaintingAction.SavePainting,
      painting: this.painting,
    });
  }

  onResolutionChange(event: MatSelectChange) {
    this.painting.canvas.resolution = event.value;
    this.painting.canvas.width =
      event.value === 'auto'
        ? window.innerWidth
        : parseInt(event.value.split('x')[0]);
    this.painting.canvas.height =
      event.value === 'auto'
        ? window.innerHeight
        : parseInt(event.value.split('x')[1]);
    this.paintingWorker.postMessage({
      type: PaintingAction.SavePainting,
      painting: this.painting,
    });
  }


  handleRestoredHistory(event: MessageEvent) {
    if (event.data.historyItems.length === 0) {
      return;
    }

    this.undoStack = event.data.historyItems;
    const mostRecentHistoryItem = this.undoStack[this.undoStack.length - 1];
    this.canvasComponent.drawImageDataToCanvas(mostRecentHistoryItem.snapshot);
    this.canvasComponent.brush = new Brush(
      'Brush',
      mostRecentHistoryItem.brushOptions
    );
    console.info(`Restored history`);
  }

  onHistoryChange(event: StackEvent) {
    if (event.type === 'push') {
      this.historyWorker.postMessage({
        type: HistoryAction.PushToHistory,
        canvas: {
          width: this.canvasComponent?.canvas?.width ?? window.innerWidth,
          height: this.canvasComponent?.canvas?.height ?? window.innerHeight,
        },
        item: event.item,
        painting: this.painting,
      });
    }
  }

  onRedoStackChange(event: StackEvent) {
    if (event.type === 'clear') {
      this.historyWorker.postMessage({
        type: HistoryAction.PopFromHistoryUntilHistoryItem,
        item: event.item,
        painting: this.painting,
      });
    }
  }
}
