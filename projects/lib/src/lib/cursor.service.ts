import { Injectable } from '@angular/core';
import { Brush } from './brushes/brush.class';

@Injectable({ providedIn: 'root' })
export class CursorService {
  cursorX = 0;

  cursorY = 0;

  cursorCircleVisible = true;

  constructor() {}

  updateCursorCirclePosition(
    circleRadius: number,
    circleBorder: number,
    event: MouseEvent
  ) {
    this.cursorX = Math.min(
      Math.max(event.clientX, circleRadius),
      window.innerWidth - circleRadius - circleBorder
    );
    this.cursorY = Math.min(
      Math.max(event.clientY, circleRadius),
      window.innerHeight - circleRadius - circleBorder
    );
  }

  getCursorCircleStyle(brush: Brush, isMouseDown: boolean): any {
    return {
      'top.px': this.cursorY,
      'left.px': this.cursorX,
      'width.px': brush.size,
      'height.px': brush.size,
      'border-color': isMouseDown
        ? brush.color
        : 'rgba(240, 240, 240, 0.5)',
    };
  }
}
