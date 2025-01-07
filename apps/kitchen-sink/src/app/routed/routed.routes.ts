import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'knot',
		loadComponent: () => import('./knot'),
	},
	{
		path: 'torus',
		loadComponent: () => import('./torus'),
	},
	{
		path: 'bomb',
		loadComponent: () => import('./bomb'),
	},
	{
		path: '',
		redirectTo: 'knot',
		pathMatch: 'full',
	},
];

export default routes;
