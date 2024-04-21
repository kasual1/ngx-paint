import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  BrushPickerPanelComponent,
  CanvasComponent,
  ColorPickerComponent,
  ColorPickerPanelComponent,
  LineBrush,
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
  brush = new LineBrush('Line', '#000000', 5);
}
