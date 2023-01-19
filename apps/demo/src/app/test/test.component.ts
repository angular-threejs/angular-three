import { Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Scene } from './scene.component';

@Component({
    selector: 'demo-test',
    standalone: true,
    template: `<ngt-canvas [scene]="Scene" />`,
    imports: [NgtCanvas],
})
export default class DemoTest {
    readonly Scene = Scene;
}
