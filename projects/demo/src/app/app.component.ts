import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  Brush,
  BrushPickerPanelComponent,
  CanvasComponent,
  ColorPickerComponent,
  ColorPickerPanelComponent,
  HistoryItem,
} from 'lib';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { StackEvent } from '../../../lib/src/public-api';
import { MatFormFieldModule } from '@angular/material/form-field';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CanvasComponent,
    ColorPickerComponent,
    ColorPickerPanelComponent,
    BrushPickerPanelComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild(CanvasComponent)
  canvasComponent!: CanvasComponent;

  worker!: Worker;

  undoStack: HistoryItem[] = [];

  dbInitialized = false;

  painting: {
    title: string;
    canvas: {
      resolution: string;
    };
  } = {
    title: 'Untitled',
    canvas: {
      resolution: '1920x1080',
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

  constructor() {
    this.initializeWorker();
  }

  initializeWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./canvas.worker', import.meta.url), {
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
    }
  }

  handleInitializeIndexedDB() {
    this.dbInitialized = true;
    // this.worker.postMessage({
    //   type: 'restoreHistory',
    //   width: window.innerWidth,
    //   height: window.innerHeight,
    // });
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
      });
    }
  }

  onResolutionChange(event: MatSelectChange) {
    this.painting.canvas.resolution = event.value;
  }
}
