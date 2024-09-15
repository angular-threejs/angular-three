import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'cannon',
		loadComponent: () => import('./cannon/cannon'),
		loadChildren: () => import('./cannon/cannon.routes'),
		title: 'Cannon - Angular Three Demo',
	},
	{
		path: 'postprocessing',
		loadComponent: () => import('./postprocessing/postprocessing'),
		loadChildren: () => import('./postprocessing/postprocessing.routes'),
		title: 'Postprocessing - Angular Three Demo',
	},
	{
		path: 'soba',
		loadComponent: () => import('./soba/soba'),
		loadChildren: () => import('./soba/soba.routes'),
		title: 'Soba - Angular Three Demo',
	},
	{
		path: 'rapier',
		loadComponent: () => import('./rapier/rapier'),
		loadChildren: () => import('./rapier/rapier.routes'),
		title: 'Rapier - Angular Three Demo',
	},
	{
		path: '',
		// redirectTo: 'cannon',
		// redirectTo: 'postprocessing',
		redirectTo: 'soba',
		pathMatch: 'full',
	},
];
