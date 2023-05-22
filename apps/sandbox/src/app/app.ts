import { NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ROUTES, RouterOutlet } from '@angular/router';
import { RouteInfo } from './models/route-info';
import { RouteCard } from './ui/route-card/route-card';

const pages = import.meta.glob(['/src/app/pages/**/*.page.ts']);

@Component({
    selector: 'sandbox-root',
    standalone: true,
    imports: [RouterOutlet, NgFor, RouteCard],
    templateUrl: './app.html',
})
export class App {
    readonly #routes = inject(ROUTES);

    readonly routes: RouteInfo[] = Object.keys(pages)
        .filter((key) => !key.endsWith('pages/index.page.ts'))
        .reduce((acc, key) => {
            const path = key.replace('/src/app/pages/', '').replace('/index.page.ts', '').replace('.page.ts', '');
            if (this.#routes[0].some((r) => r.path === path)) {
                acc.push({
                    asset: `https://github.com/angular-threejs/assets/blob/main/examples/${path}`,
                    title: path,
                    path,
                });
            }
            return acc;
        }, [] as RouteInfo[]);
}
