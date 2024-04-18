import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CdkDrag, CdkDragMove } from '@angular/cdk/drag-drop';

@Component({
  selector: 'ngx-paint-hue-picker',
  standalone: true,
  imports: [CdkDrag],
  template: `
    <div #hueDragBoundary class="hue-drag-boundary">
      <div
        cdkDrag
        class="hue-drag"
        cdkDragLockAxis="x"
        cdkDragBoundary=".hue-drag-boundary"
        (cdkDragMoved)="onDragMoved($event)"
      ></div>
    </div>

    <pre>x:{{ x }}</pre>
  `,
  styles: `
    .hue-drag-boundary {
      height: 20px;
      width: 100%;
      border-radius: 10px;
      position: relative;
      background: linear-gradient(
          to right,
          rgb(255 0 0),
          rgb(255 255 0),
          rgb(0 255 0),
          rgb(0 255 255),
          rgb(0 0 255),
          rgb(255 0 255),
          rgb(255 0 0)
      );
    }

    .hue-drag {
      border: 2px solid rgb(203 213 225);
      border-radius: 50%;
      position: absolute;
      top: 0px;
      left: 0px;
      width: 16px;
      height: 16px;
      cursor: move;
      user-select: none;
      touch-action: none;
    }

    .drag:active {
      border: 2px solid red;
    }
  `,
})
export class HuePickerComponent {

  @Output()
  hueChange = new EventEmitter<number>();

  @ViewChild('hueDragBoundary')
  dragBoundary!: ElementRef<HTMLElement>;

  x = 0;

  onDragMoved(event: CdkDragMove) {
    const dragPosition = event.source.getFreeDragPosition();
    this.x = dragPosition.x;

    const hue = this.getHueAt(dragPosition.x);
    this.hueChange.emit(hue);
  }

  getHueAt(x: number) {
    const width = this.dragBoundary.nativeElement.clientWidth;
    const hue = Math.trunc(x / width * 342);
    return hue;
  }

}
