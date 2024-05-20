import {  Injectable, ViewContainerRef } from '@angular/core';
import { NotificationComponent } from './notification.component';

@Injectable({providedIn: 'root'})
export class NotificationService {
  viewContainerRef: ViewContainerRef | undefined;

  notify(message: string) {

    if (!this.viewContainerRef) {
      throw new Error('ViewContainerRef not set');
    }

    const ref = this.viewContainerRef.createComponent(NotificationComponent);

    ref.instance.message = message;

    setTimeout(() => ref.destroy(), 3000);
  }

}
