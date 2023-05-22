import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'sandbox-root',
    standalone: true,
    imports: [RouterOutlet],
    template: ` <router-outlet />`,
})
export class AppComponent {}
