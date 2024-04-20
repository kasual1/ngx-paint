import { Component, EventEmitter, Output } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { ColorPickerPanelComponent } from './color-picker-panel.component';

@Component({
  selector: 'ngx-paint-color-picker',
  standalone: true,
  imports: [OverlayModule, ColorPickerPanelComponent],
  template: `
    <div
      cdkOverlayOrigin
      #trigger="cdkOverlayOrigin"
      class="selected-color"
      [style.background]="color"
      (click)="isOpen = !isOpen"
    ></div>

    <ng-template
      cdkConnectedOverlay
      cdkConnectedOverlayHasBackdrop="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayOffsetY]="-12"
      [cdkConnectedOverlayOffsetX]="16"
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
      <ngx-paint-color-picker-panel
        [color]="color"
        (colorChange)="onColorChange($event)"
      ></ngx-paint-color-picker-panel>
    </ng-template>
  `,
  styles: `
    :host{
      display: flex;
    }

    .selected-color {
      height: 40px;
      width: 40px;
      border-radius: 50%;
      border: 1px solid #ccc;

      &:hover {
        border-color: #aaa;
        cursor: pointer;
      }
    }
  `,
})
export class ColorPickerComponent {
  @Output()
  colorChange = new EventEmitter<string>();

  @Output()
  close = new EventEmitter<void>();

  isOpen = false;

  color: string = '#ffffff';

  onColorChange(color: string) {
    this.color = color;
    this.colorChange.emit(this.color);
  }

  onBackdropClick() {
    this.isOpen = false;
    this.close.emit();
  }
}
