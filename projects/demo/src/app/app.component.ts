import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  BrushPickerPanelComponent,
  CanvasComponent,
  ColorPickerComponent,
  ColorPickerPanelComponent,
  HistoryItem,
  StackEvent,
} from 'lib';
import { MatButtonModule } from '@angular/material/button';
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

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./canvas.worker', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.postMessage({ type: 'restoreHistory' });
    } else {
      throw new Error('Web Workers are not supported in this environment');
    }
  }

  handleMessage(event: MessageEvent) {
    switch (event.data.type) {
      case 'restoreHistory':
        this.undoStack = event.data.data;
        break;
    }
  }

  onUndoStackChange(event: StackEvent) {
    if (event.data.length > 1) {
      const lastItem = event.data[event.data.length - 1];
      const secondLastItem = event.data[event.data.length - 2];

      if (event.type === 'push') {
        this.worker.postMessage({
          type: 'pushToHistory',
          canvas: {
            width: this.canvasComponent.canvas!.width,
            height: this.canvasComponent.canvas!.height,
          },
          lastImageData: lastItem.snapshot,
          secondLastImageData: secondLastItem.snapshot,
        });
      }

      if(event.type === 'pop') {
        this.worker.postMessage({ type: 'popFromHistory' });
      }
    }
  }
}
