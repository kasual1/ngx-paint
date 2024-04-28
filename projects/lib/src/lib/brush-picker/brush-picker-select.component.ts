import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CdkMenuModule } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { Brush } from '../brushes/base-brush.class';

@Component({
  selector: 'ngx-paint-brush-picker-select',
  standalone: true,
  imports: [CommonModule, CdkMenuModule],
  template: `
    <button
      #menuButton
      [cdkMenuTriggerFor]="menu"
      class="example-standalone-trigger"
    >
      <span class="brush-picker-select-selected-brush">
        <span
          class="brush-picker-select-option-icon material-symbols-outlined"
          >{{ brush.icon }}</span
        >{{ brush.name }}
      </span>

      <span class="material-symbols-outlined">keyboard_arrow_down</span>
    </button>

    <ng-template #menu>
      <div #cdkMenu class="example-menu" cdkMenu>
        @for(option of brushOptions;track option.name; let last = $last){
        <button cdkMenuItem class="example-menu-item" [class.last]="last" (click)="onMenuItemClick(option)">
          <span
            class="brush-picker-select-option-icon material-symbols-outlined"
            >{{ option.icon }}</span
          >
          {{ option.name }}
        </button>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host{
      display: flex;
      width: 100%;
    }

    .example-menu {
      display: inline-flex;
      flex-direction: column;
      width: 100%
      background-color: rgba(255, 255, 255);
      padding: 6px 0;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    .example-standalone-trigger {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      border: none;
      background-color: white;
      width: 100%;
      padding: 0 4px;
      line-height: 36px;
      cursor: pointer
    }

    .example-menu-item {
      width: 300px;
      background-color: white;
      cursor: pointer;
      border: none;
      user-select: none;
      min-width: 64px;
      line-height: 36px;
      padding: 0 4px;

      display: flex;
      align-items: center;
      flex-direction: row;
      flex: 1;

      &.last {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }

    .example-menu-item:hover {
      background-color: rgb(244, 244, 244);
    }

    .example-menu-item:active {
      background-color: rgb(214, 214, 214);
    }

    .brush-picker-select-selected-brush{
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }

    .brush-picker-select-option-icon{
      border: 1px solid #ccc;
      padding: 4px;
      border-radius: 50%;
      transform: scale(0.6);
      color: #333;
    }
  `,
})
export class BrushPickerSelectComponent {
  @Input({required: true})
  brush!: Brush;

  @Input({required: true})
  brushOptions!: Brush[]

  @Output()
  brushChange = new EventEmitter<Brush>();

  onMenuItemClick(brush: Brush) {
    this.brushChange.emit(brush);
  }
}
