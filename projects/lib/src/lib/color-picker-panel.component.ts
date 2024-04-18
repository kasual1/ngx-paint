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
          #drag
          cdkDrag
          class="drag"
          cdkDragBoundary=".drag-boundary"
          (cdkDragMoved)="onDragMoved($event)"
        ></div>
      </div>
    </div>

    <div style="padding: 12px">
    <ngx-paint-hue-picker (hueChange)="onHueChange($event)"></ngx-paint-hue-picker>

    <pre>x:{{ x }} y:{{ y }}</pre>

    <pre>HSV: {{ hsvColor }}</pre>

    <pre>RGB: {{ rgbColor }}</pre>

    <pre>Hex: {{ hexColor }}</pre>


    </div>
  `,
  styles: `
    :host{
      display: flex;
      flex-direction: column;
      width: 300px;
    }

    .drag-boundary {
      padding: 14px;
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
      height: 200px;
      max-width: 100%;
    }
  `,
})
export class ColorPickerPanelComponent {
  @ViewChild('dragBoundary')
  dragBoundary!: ElementRef<HTMLElement>;

  @ViewChild('drag')
  drag!: ElementRef<HTMLElement>;

  @ViewChild('colorPalette')
  colorPalette!: ElementRef<HTMLElement>;

  x = 0;

  y = 0;

  hue = 0;

  saturation = 0;

  value = 0;

  get colorPaletteBackground() {
    return `linear-gradient(to bottom, transparent, black) no-repeat,
            linear-gradient(to right, white, transparent) no-repeat,
            hsl(${this.hue}, 100%, 50%)`;
  }


  get hsvColor(): string {
    return `hsv(${this.hue}, ${this.saturation}%, ${this.value}%)`;
  }

  get rgbColor(): string {
    const {r, g, b} = this.hsvToRgb(this.hue, this.saturation, this.value);
    return `rgb(${r}, ${g}, ${b})`;
  }

  get hexColor(): string {
    const {r, g, b} = this.hsvToRgb(this.hue, this.saturation, this.value);
    return this.rgbToHex(r, g, b);
  }


  onDragMoved(event: CdkDragMove) {
    const dragPosition = event.source.getFreeDragPosition();
    const boundaryRef = this.dragBoundary.nativeElement;
    const colorPaletteRef = this.colorPalette.nativeElement;

    this.x = dragPosition.x - boundaryRef.offsetLeft;
    this.y = dragPosition.y - boundaryRef.offsetTop;

    this.saturation = Math.trunc(100 * this.x / colorPaletteRef.offsetWidth);
    this.value = Math.trunc(100 * (1 - (this.y  / colorPaletteRef.offsetHeight)));
  }

  hsvToRgb(h: number, s: number, v: number) {
    s /= 100;
    v /= 100;

    const i = ~~(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));
    const index = i % 6;

    const r = Math.trunc([v, q, p, p, t, v][index] * 255);
    const g = Math.trunc([t, v, v, q, p, p][index] * 255);
    const b = Math.trunc([p, p, t, v, v, q][index] * 255);
    return { r, g, b };
  }

  rgbToHex(r: number, g: number, b: number, a: number = 1) {
    const [rr, gg, bb, aa] = [r, g, b, Math.round(a * 255)].map((v) => v.toString(16).padStart(2, "0"));
    return ["#", rr, gg, bb, aa === "ff" ? "" : aa].join("");
  }


  onHueChange(hue: number) {
    this.hue = hue;
  }
}
