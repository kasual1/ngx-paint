import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
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
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./canvas.worker', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.postMessage({ type: 'initializeIndexedDB' });
      // this.worker.postMessage({ type: 'restoreHistory' });
    } else {
      throw new Error('Web Workers are not supported in this environment');
    }
  }

  handleMessage(event: MessageEvent) {
    switch (event.data.type) {
      case 'initializeIndexedDB':
        this.dbInitialized = true;
        break;
      case 'restoreHistory':
        this.undoStack = event.data.data;
        break;
    }
  }

  onUndoStackChange(event: StackEvent) {
    if (!this.dbInitialized) {
      return;
    }

    if (event.type === 'push') {
      this.worker.postMessage({
        type: 'pushToHistory',
        canvas: {
          width: this.canvasComponent.canvas!.width,
          height: this.canvasComponent.canvas!.height,
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
      console.log('Clearing history until: ', event.item?.uuid);
      this.worker.postMessage({
        type: 'popFromHistoryUntilHistoryItem',
        item: event.item
      });
    }
  }
}
