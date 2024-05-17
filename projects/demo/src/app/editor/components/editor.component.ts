import {
  Component,
  Input,
  ViewChild,
} from '@angular/core';
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
import { IndexedDbHelper as IndexedDbService } from '../../core/services/indexeddb.service';
import { HistoryItemService } from '../services/history-item.service';
import { Painting } from '../models/painting.model';

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
    @if(painting !== undefined){
    <div class="top-panel">
      <mat-form-field>
        <mat-label>Title</mat-label>
        <input
          matInput
          [value]="painting.title"
          (input)="onTitleChange($event)"
        />
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
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 1;
      display: flex;
      justify-content: center;
      gap: 10px;
      margin: 12px;
    }
  `,
})
export class EditorComponent {
  @Input()
  set id(id: string | undefined) {
    if (id === undefined) {
      this.createPainting();
    } else {
      this.loadPainting(id);
    }
  }

  @ViewChild(CanvasComponent)
  canvasComponent!: CanvasComponent;

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

  constructor(
    private indexedDbService: IndexedDbService,
    private location: Location,
    private uuidService: UuidService,
    private historyItemService: HistoryItemService
  ) {}

  async createPainting() {
    this.painting = {
      id: this.uuidService.createUuid(),
      title: 'Untitled',
      canvas: {
        resolution: '800x600',
        width: 800,
        height: 600,
      },
    };
    const id = await this.indexedDbService.saveObject(
      'painting',
      this.painting.id,
      this.painting
    );

    this.location.replaceState(`/${id}`);
  }

  async loadPainting(id: string) {
    this.painting = await this.indexedDbService.getObject('painting', id);

    if (!this.painting) {
      this.createPainting();
    }

    const lowerBound = this.historyItemService.buildHistoryKey(
      this.painting.id,
      new Date(0)
    );

    const upperBound = this.historyItemService.buildHistoryKey(
      this.painting.id,
      new Date()
    );

    const compressedHistoryItems =
      await this.indexedDbService.getObjectsWithinRange(
        'history',
        lowerBound,
        upperBound
      );

    const historyItems =
      this.historyItemService.convertCompressedHistoryItemsToHistoryItems(
        compressedHistoryItems,
        this.painting.canvas.width,
        this.painting.canvas.height
      );

    this.undoStack = historyItems;

    if (this.undoStack.length > 0) {
      const mostRecentHistoryItem = this.undoStack[this.undoStack.length - 1];
      this.canvasComponent.drawImageDataToCanvas(
        mostRecentHistoryItem.snapshot
      );
      this.canvasComponent.brush = new Brush(
        'Brush',
        mostRecentHistoryItem.brushOptions
      );
    }
  }

  onTitleChange(event: Event) {
    this.painting.title = (event.target as HTMLInputElement).value;
    this.indexedDbService.saveObject(
      'painting',
      this.painting.id,
      this.painting
    );
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
    this.indexedDbService.saveObject(
      'painting',
      this.painting.id,
      this.painting
    );
  }

  onHistoryChange(event: StackEvent) {
    if (event.type === 'push' && event.item) {
      const compressedItem =
        this.historyItemService.createCompressedHistoryItem(event.item);

      const key = this.historyItemService.buildHistoryKey(
        this.painting.id,
        event.item.timestamp
      );

      this.indexedDbService.saveObject('history', key, compressedItem);
    }
  }

  onRedoStackChange(event: StackEvent) {
    if (event.type === 'clear' && event.item) {
      const key = this.historyItemService.buildHistoryKey(
        this.painting.id,
        event.item.timestamp
      );

      this.indexedDbService.deleteUntilKey('history', key);
    }
  }
}
