import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'test', pathMatch: 'full' },
    { path: 'test', loadComponent: () => import('./test/test.component') },
    { path: 'view-cube', loadComponent: () => import('./view-cube/view-cube.component') },
];
