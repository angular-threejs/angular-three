import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./home/home.component') },
    {
        path: 'cubes',
        loadComponent: () => import('./cubes/cubes.component'),
        data: {
            description: 'Simple cubes',
            link: '/cubes',
            asset: 'assets/demo/cubes',
        },
    },
    {
        path: 'view-cube',
        loadComponent: () => import('./view-cube/view-cube.component'),
        data: {
            description: 'Heads-up display using NgtPortal',
            link: '/view-cube',
            asset: 'assets/demo/view-cube',
        },
    },
    {
        path: 'vertex-colors-instance',
        loadComponent: () => import('./vertex-colors-instance/vertex-colors-instance.component'),
        data: {
            description: 'Three.js vertex colors with instances',
            link: '/vertex-colors-instance',
            asset: 'assets/demo/vertex-colors-instances',
        },
    },
];
