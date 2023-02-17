import { Component } from '@angular/core';
import { NgtCanvas, NgtRoutedScene } from 'angular-three';

@Component({
    standalone: true,
    template: ` <ngt-canvas [sceneGraph]="scene" /> `,
    imports: [NgtCanvas],
})
export default class Scene {
    readonly scene = NgtRoutedScene;
}
