import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CdkDrag, CdkDragMove } from '@angular/cdk/drag-drop';
import { HuePickerComponent } from './hue-picker.component';
import { ColorService } from './color.service';

@Component({
  selector: 'ngx-paint-color-picker-panel',
  standalone: true,
  imports: [CdkDrag, HuePickerComponent],
  template: `
    <div #dragBoundary class="drag-boundary">
      <div
        #colorPalette
        class="color-palette"
        [style.background]="colorPaletteBackground"
      >
        <div
          #drag
          cdkDrag
          class="drag"
          cdkDragBoundary=".drag-boundary"
          [style.background]="hexColor"
          (cdkDragMoved)="onDragMoved($event)"
        ></div>
      </div>
    </div>

    <div class="color-picker-control-panel">
      <ngx-paint-hue-picker
        (hueChange)="onHueChange($event)"
      ></ngx-paint-hue-picker>

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
      border: 2px solid rgb(203 213 225);
    }

    .color-palette {
      width: 100%;
      height: 200px;
      max-width: 100%;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1), 2px 0 4px rgba(0, 0, 0, 0.1), -2px 0 4px rgba(0, 0, 0, 0.1);
    }

    .color-picker-control-panel {
      padding: 12px;
      margin: -14px 14px;
      background-color: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(10px);
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 2px 0 4px rgba(0, 0, 0, 0.1), -2px 0 4px rgba(0, 0, 0, 0.1);
    }
  `,
})
export class ColorPickerPanelComponent implements OnInit {
  @Input()
  color = '';

  @Output()
  colorChange = new EventEmitter<string>();

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
    const { r, g, b } = this.colorService.hsvToRgb(
      this.hue,
      this.saturation,
      this.value
    );
    return `rgb(${r}, ${g}, ${b})`;
  }

  get hexColor(): string {
    const { r, g, b } = this.colorService.hsvToRgb(
      this.hue,
      this.saturation,
      this.value
    );
    return this.colorService.rgbToHex(r, g, b);
  }

  constructor(private colorService: ColorService) {}

  ngOnInit(): void {
    if (this.color) {
      const { h, s, v } = this.colorService.hexToHsv(this.color);

      this.hue = h;
      this.saturation = s;
      this.value = v;
    }
  }

  onDragMoved(event: CdkDragMove) {
    const dragPosition = event.source.getFreeDragPosition();
    const boundaryRef = this.dragBoundary.nativeElement;
    const colorPaletteRef = this.colorPalette.nativeElement;

    this.x = dragPosition.x - boundaryRef.offsetLeft;
    this.y = dragPosition.y - boundaryRef.offsetTop;

    this.saturation = Math.trunc((100 * this.x) / colorPaletteRef.offsetWidth);
    this.value = Math.trunc(100 * (1 - this.y / colorPaletteRef.offsetHeight));

    this.colorChange.emit(this.hexColor);
  }

  onHueChange(hue: number) {
    this.hue = hue;
    this.colorChange.emit(this.hexColor);
  }
}
