import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { IndexedDbHelper } from './core/services/indexeddb.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: (indexedDbService: IndexedDbHelper) => () => indexedDbService.initialize(),
      deps: [IndexedDbHelper],
      multi: true,
    }
  ]
};
