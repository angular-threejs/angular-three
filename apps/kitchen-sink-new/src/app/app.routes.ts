import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'core-new-sink',
		loadComponent: () => import('./core-new-sink/core-new-sink'),
	},
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
		path: '',
		// redirectTo: 'cannon',
		// redirectTo: 'postprocessing',
		// redirectTo: 'soba',
		redirectTo: 'cannon',
		pathMatch: 'full',
	},
];
