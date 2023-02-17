import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./red-scene.component'),
    },
    {
        path: 'blue',
        loadComponent: () => import('./blue-scene.component'),
    },
];

export default routes;
