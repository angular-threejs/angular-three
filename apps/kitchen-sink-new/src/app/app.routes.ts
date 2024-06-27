import { Route } from '@angular/router';

export const appRoutes: Route[] = [
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
