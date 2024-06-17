import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'cannon',
		loadComponent: () => import('./cannon/cannon'),
		loadChildren: () => import('./cannon/cannon.routes'),
	},
	{
		path: '',
		redirectTo: 'cannon',
		pathMatch: 'full',
	},
];
