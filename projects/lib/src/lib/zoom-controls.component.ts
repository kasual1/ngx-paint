import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ngx-paint-zoom-controls',
  standalone: true,
  imports: [],
  template: `
    <button (click)="onZoomIn()">
      <span class="material-symbols-outlined">add</span>
    </button>

    <button (click)="onZoomOut()">
      <span class="material-symbols-outlined">remove</span>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      gap: 4px;
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
  `,
})
export class ZoomControlsComponent {
  @Output()
  zoomIn = new EventEmitter();

  @Output()
  zoomOut = new EventEmitter();

  onZoomIn() {
    this.zoomIn.emit();
  }

  onZoomOut() {
    this.zoomOut.emit();
  }
}
