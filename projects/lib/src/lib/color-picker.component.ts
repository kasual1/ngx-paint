import { Component } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { ColorPickerPanelComponent } from './color-picker-panel.component';

@Component({
  selector: 'ngx-paint-color-picker',
  standalone: true,
  imports: [OverlayModule, ColorPickerPanelComponent],
  template: `
    <div
      #trigger="cdkOverlayOrigin"
      cdkOverlayOrigin
      class="selected-color"
      (click)="isOpen = !isOpen"
    ></div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
    >
      <ngx-paint-color-picker-panel></ngx-paint-color-picker-panel>
    </ng-template>
  `,
  styles: `
    :host{
      display: flex;
    }

    .selected-color {
      background-color: red;
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
  isOpen = false;
}
