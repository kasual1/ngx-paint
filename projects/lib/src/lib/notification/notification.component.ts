import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-paint-notification',
  standalone: true,
  imports: [],
  template: `
    {{ message }}
  `,
  styles: `
    :host {
      background-color: rgba(240, 240, 240, 0.85);
      backdrop-filter: blur(10px);
      padding: 12px 24px;
      position: fixed;
      bottom: 0;
      left: 50%;
      margin: 12px;
    }
  `
})
export class NotificationComponent {

  @Input({ required: true})
  message!: string;

}
