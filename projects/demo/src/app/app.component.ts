import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  BrushPickerPanelComponent,
  CanvasComponent,
  ColorPickerComponent,
  ColorPickerPanelComponent,
} from 'lib';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CanvasComponent,
    ColorPickerComponent,
    ColorPickerPanelComponent,
    BrushPickerPanelComponent,
    MatButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {

  onUndoStackChange(undoStack: any[]) {
    console.log(undoStack);
  }

  onRedoStackChange(redoStack: any[]) {
    console.log(redoStack);
  }
}
