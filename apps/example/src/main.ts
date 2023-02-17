import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
    providers: [
        provideRouter([
            {
                path: '',
                loadComponent: () => import('./app/red-scene.component'),
            },
            {
                path: 'blue',
                loadComponent: () => import('./app/blue-scene.component'),
            },
        ]),
    ],
}).catch((err) => console.error(err));
