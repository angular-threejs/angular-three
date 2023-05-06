import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            [
                {
                    path: '',
                    redirectTo: 'routed',
                    pathMatch: 'full',
                },
                {
                    path: 'routed',
                    loadComponent: () => import('./scene/scene.component'),
                    loadChildren: () => import('./scene/scene.routes'),
                },
            ]
            // withDebugTracing()
        ),
    ],
};
