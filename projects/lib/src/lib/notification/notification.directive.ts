import { Directive, ViewContainerRef } from '@angular/core';
import { NotificationService } from './notification.service';

@Directive({
  selector: '[ngxPaintNotification]',
  standalone: true
})
export class NotificationDirective {

  constructor(
    private viewContainerRef: ViewContainerRef,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.notificationService.viewContainerRef = this.viewContainerRef;
  }

}
