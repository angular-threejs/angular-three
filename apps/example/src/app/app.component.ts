import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { extend } from 'angular-three';
import * as THREE from 'three';

extend(THREE);

@Component({
    standalone: true,
    selector: 'angular-three-root',
    template: `
        <ul>
            <li>
                <a routerLink="/routed" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Red</a>
            </li>
            <li>
                <a routerLink="/routed/blue" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
                    Blue
                </a>
            </li>
        </ul>
        <router-outlet />
    `,
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
export class AppComponent {}
