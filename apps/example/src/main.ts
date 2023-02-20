import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
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
                    loadComponent: () => import('./app/scene/scene.component'),
                    loadChildren: () => import('./app/scene/scene.routes'),
                },
            ]
            // withDebugTracing()
        ),
    ],
}).catch((err) => console.error(err));
