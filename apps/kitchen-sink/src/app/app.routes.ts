import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'cannon',
		loadComponent: () => import('./cannon/cannon'),
		loadChildren: () => import('./cannon/cannon.routes'),
	},
	{
		path: 'postprocessing',
		loadComponent: () => import('./postprocessing/postprocessing'),
		loadChildren: () => import('./postprocessing/postprocessing.routes'),
	},
	{
		path: 'soba',
		loadComponent: () => import('./soba/soba'),
		loadChildren: () => import('./soba/soba.routes'),
	},
	{
		path: 'core-new-sink',
		loadComponent: () => import('./core-new-sink/core-new-sink'),
	},
	{
		path: '',
		// redirectTo: 'cannon',
		// redirectTo: 'postprocessing',
		// redirectTo: 'soba',
		redirectTo: 'core-new-sink',
		pathMatch: 'full',
	},
];
