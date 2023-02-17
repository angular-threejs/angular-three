import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    standalone: true,
    selector: 'ngt-routed-scene',
    template: `<router-outlet />`,
    imports: [RouterOutlet],
})
export class NgtRoutedScene {
    static isRoutedScene = true;
}
