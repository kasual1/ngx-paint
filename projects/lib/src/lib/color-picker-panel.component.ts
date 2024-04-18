import { Component, ElementRef, ViewChild } from '@angular/core';
import { CdkDrag, CdkDragMove } from '@angular/cdk/drag-drop';
import { HuePickerComponent } from './hue-picker.component';

@Component({
  selector: 'ngx-paint-color-picker-panel',
  standalone: true,
  imports: [CdkDrag, HuePickerComponent],
  template: `
    <div #dragBoundary class="drag-boundary">
      <div #colorPalette class="color-palette" [style.background]="colorPaletteBackground">
        <div
          cdkDrag
          class="drag"
          cdkDragBoundary=".drag-boundary"
          (cdkDragMoved)="onDragMoved($event)"
        ></div>
      </div>
    </div>

    <div style="padding: 12px">
    <ngx-paint-hue-picker (hueChange)="onHueChange($event)"></ngx-paint-hue-picker>

    <pre>HSL: {{ hslColor }}</pre>
    </div>
  `,
  styles: `
    :host{
      display: flex;
      flex-direction: column;
    }

    .drag-boundary {
      padding: 12px;
    }

    .drag {
      border: 2px solid rgb(203 213 225);
      border-radius: 50%;
      transform: translate3d(0, 0, 0);
      position: absolute;
      top: 0px;
      left: 0px;
      width: 24px;
      height: 24px;
      cursor: move;
      user-select: none;
      touch-action: none;
    }

    .drag:active {
      border: 2px solid red;
    }

    .color-palette {
      width: 100%;
      height: 355px;
      max-width: 100%;
    }
  `,
})
export class ColorPickerPanelComponent {
  @ViewChild('dragBoundary')
  dragBoundary!: ElementRef<HTMLElement>;

  @ViewChild('colorPalette')
  colorPalette!: ElementRef<HTMLElement>;

  x = 0;

  y = 0;

  hue = 0;

  saturation = 0;

  lightness = 0;

  get colorPaletteBackground() {
    return `linear-gradient(to bottom, transparent, black) no-repeat,
            linear-gradient(to right, white, transparent) no-repeat,
            hsl(${this.hue}, 100%, 50%)`;
  }

  get hslColor(): string {
    return `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
  }


  onDragMoved(event: CdkDragMove) {
    const dragPosition = event.source.getFreeDragPosition();
    const boundaryRef = this.dragBoundary.nativeElement;
    this.x = dragPosition.x - boundaryRef.offsetLeft;
    this.y = dragPosition.y - boundaryRef.offsetTop;

    this.saturation = Math.trunc((this.x / boundaryRef.offsetWidth) * 100);
    this.lightness = Math.trunc(100 - (this.y / boundaryRef.offsetHeight) * 100);
    console.log(this.x, boundaryRef.offsetWidth);
  }

  onHueChange(hue: number) {
    this.hue = hue;
  }
}
