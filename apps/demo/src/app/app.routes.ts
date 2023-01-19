import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'test', pathMatch: 'full' },
    { path: 'test', loadComponent: () => import('./test/test.component') },
];
