import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { extend, NgtCanvas, NgtRoutedScene } from 'angular-three';
import * as THREE from 'three';

extend(THREE);

@Component({
    standalone: true,
    selector: 'angular-three-root',
    template: `
        <ul>
            <li>
                <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Red</a>
            </li>
            <li>
                <a routerLink="/blue" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Blue</a>
            </li>
        </ul>
        <ngt-canvas [sceneGraph]="scene" />
    `,
    imports: [NgtCanvas, RouterLink, RouterLinkActive],
    styles: [
        `
            ul {
                display: flex;
                gap: 1rem;
            }

            li {
                list-style: none;
            }

            a.active {
                color: blue;
                text-decoration: underline;
                border: 1px solid;
                padding: 0.25rem;
            }
        `,
    ],
})
export class AppComponent {
    readonly scene = NgtRoutedScene;
}
