import { Injectable } from '@angular/core';
import { LineSegment } from './brushes/base-brush.class';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  undoStack: Array<LineSegment[]> = [];

  redoStack: Array<LineSegment[]> = [];

  add(line: LineSegment[]): void {
    if(line.length > 0){
      this.undoStack.push(line);
    }
  }

  undo(): void {
    if (this.undoStack.length > 0) {
      const item = this.undoStack.pop()!;
      this.redoStack.push(item);
    }
  }

  redo(): void {
    if (this.redoStack.length > 0) {
      const item = this.redoStack.pop()!;
      this.undoStack.push(item);
    }
  }
}
