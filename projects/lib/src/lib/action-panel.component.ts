import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { BrushPickerComponent } from './brush-picker/brush-picker.component';
import { BaseBrush, Brush } from './brushes/base-brush.class';
import { BaseStylus } from './brushes/base-stylus.class';
import { BaseEraser } from './brushes/base-eraser.class';
@Component({
  selector: 'ngx-paint-action-panel',
  standalone: true,
  imports: [BrushPickerComponent,  ColorPickerComponent],
  template: `
    <ngx-paint-brush-picker
      [brush]="brush"
      [brushOptions]="brushOptions"
      (brushChange)="onBrushChange($event)"
      (click)="onBrushPickerClick()"
      (close)="onBrushPickerClose()"
    ></ngx-paint-brush-picker>

    <ngx-paint-color-picker
      [color]="brush.color"
      (colorChange)="onColorChange($event)"
      (click)="onColorPickerClick()"
      (close)="onColorPickerClose()"
    ></ngx-paint-color-picker>

    <div class="divider"></div>

    <button (click)="onUndo()">
      <span class="material-symbols-outlined">undo</span>
    </button>

    <button (click)="onRedo()">
      <span class="material-symbols-outlined">redo</span>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      background-color: rgba(240, 240, 240, 0.85);
      backdrop-filter: blur(10px);
      padding: 12px;
      margin: 12px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      max-height: calc(100% - 48px);
    }

    button {
      border-radius: 50%;
      padding: 6px 6px;
      border: 1px solid #ccc;
      outline: none;

      &:hover {
        background-color: #f8f8f8;
        border-color: #aaa;
        cursor: pointer;
      }
    }

    .divider {
      height: 1px;
      width: 100%;
      background-color: #ccc;
    }
  `,
})
export class ActionPanelComponent {
  @Input()
  brush!: Brush;

  @Output()
  brushChange = new EventEmitter<Brush>();

  @Output()
  eraserChange = new EventEmitter<Brush>();

  @Output()
  colorChange = new EventEmitter<string>();

  @Output()
  undo = new EventEmitter<void>();

  @Output()
  redo = new EventEmitter<void>();

  brushOptions: Brush[] = [
    new BaseBrush('Brush', { color: '#00000', size: 20 }),
    new BaseStylus('Stylus', { color: '#00000', size: 20 }),
    new BaseEraser('Eraser', { size: 20 }),
  ];

  active = false;

  onBrushChange(brush: Brush) {
    this.brushChange.emit(brush);
  }

  onBrushPickerClick() {
    this.active = !this.active;
  }

  onBrushPickerClose() {
    this.active = false;
  }

  onColorChange(color: string) {
    this.colorChange.emit(color);
  }

  onColorPickerClick() {
    this.active = !this.active;
  }

  onColorPickerClose() {
    this.active = false;
  }

  onUndo() {
    this.undo.emit();
  }

  onRedo() {
    this.redo.emit();
  }
}
