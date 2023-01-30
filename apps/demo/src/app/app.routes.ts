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
    {
        path: 'animation-keyframes',
        loadComponent: () => import('./animation-keyframes/animation-keyframes.component'),
        data: {
            description: 'Three.js WebGL animation with keyframes',
            link: '/animation-keyframes',
            asset: 'assets/demo/animation-keyframes',
        },
    },
    {
        path: 'animation-skinning-ik',
        loadComponent: () => import('./animation-skinning-ik/animation-skinning-ik.component'),
        data: {
            description: 'Three.js animation with CCDIKSolver',
            link: '/animation-skinning-ik',
            asset: 'assets/demo/animation-skinning-ik',
        },
    },

    {
        path: 'camera',
        loadComponent: () => import('./camera/camera.component'),
        data: {
            description: 'THREE.js Cameras with helpers',
            link: '/camera',
            asset: 'assets/demo/camera',
        },
    },
];
