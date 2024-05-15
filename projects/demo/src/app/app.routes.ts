import { Routes } from '@angular/router';
import { EditorComponent } from './editor/components/editor.component';

export const routes: Routes = [
  {
    path: '',
    component: EditorComponent
  },
  {
    path: ':id',
    component: EditorComponent
  }
];
