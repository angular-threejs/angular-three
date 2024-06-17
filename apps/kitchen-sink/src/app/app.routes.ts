import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'cannon',
		loadComponent: () => import('./cannon/basic/basic'),
	},
	{
		path: '',
		redirectTo: 'cannon',
		pathMatch: 'full',
	},
];
