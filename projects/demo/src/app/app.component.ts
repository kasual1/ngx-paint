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
import { StackEvent } from '../../../lib/src/public-api';
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
    this.worker.postMessage({
      type: 'restoreHistory',
      width: window.innerWidth,
      height: window.innerHeight,
    });
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
}
