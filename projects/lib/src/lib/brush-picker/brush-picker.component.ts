import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { BrushPickerPanelComponent } from './brush-picker-panel.component';
import { Brush } from '../brushes/brush.model';

@Component({
  selector: 'ngx-paint-brush-picker',
  standalone: true,
  imports: [OverlayModule, BrushPickerPanelComponent],
  template: `
    <button
      cdkOverlayOrigin
      #trigger="cdkOverlayOrigin"
      class="selected-color"
      (click)="isOpen = !isOpen"
    >
      <span class="material-symbols-outlined">{{ brush.icon }}</span>
    </button>

    <ng-template
      cdkConnectedOverlay
      cdkConnectedOverlayHasBackdrop="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayOffsetY]="-12"
      [cdkConnectedOverlayOffsetX]="32"
      [cdkConnectedOverlayPositions]="[
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top'
        }
      ]"
      (backdropClick)="onBackdropClick()"
    >
      <ngx-paint-brush-picker-panel
        [brush]="brush"
        (brushChange)="onBrushChange($event)"
      ></ngx-paint-brush-picker-panel>
    </ng-template>
  `,
  styles: `
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
  `,
})
export class BrushPickerComponent {
  @Input()
  brush!: Brush;

  @Output()
  brushChange = new EventEmitter<Brush>();

  @Output()
  close = new EventEmitter<void>();

  isOpen = false;

  onBrushChange(brush: Brush) {
    this.brushChange.emit(brush);
  }

  onBackdropClick() {
    this.isOpen = false;
    this.close.emit();
  }
}
