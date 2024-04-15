import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ngx-paint-action-panel',
  standalone: true,
  imports: [],
  template: `
    <button>
      <span class="material-symbols-outlined">brush</span>
    </button>

    <div class="color-picker"></div>

    <div class="divider"></div>

    <button (click)="onUndo()">
      <span class="material-symbols-outlined">undo</span>
    </button>

    <button (click)="onRedo()">
      <span class="material-symbols-outlined">redo</span>
    </button>

  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background-color: #f0f0f0;
      padding: 12px;
      margin: 12px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      max-height: calc(100% - 48px);
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

    .color-picker{
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

    .divider {
      height: 1px;
      background-color: #ccc;
    }
  `,
})
export class ActionPanelComponent {
  @Output()
  undo = new EventEmitter<void>();

  @Output()
  redo = new EventEmitter<void>();

  onUndo() {
    this.undo.emit();
  }

  onRedo() {
    this.redo.emit();
  }
}
