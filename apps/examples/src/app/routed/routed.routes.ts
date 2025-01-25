import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'red',
		loadComponent: () => import('./red'),
	},
	{
		path: 'blue',
		loadComponent: () => import('./blue'),
	},
	{
		path: '',
		redirectTo: 'red',
		pathMatch: 'full',
	},
];

export default routes;
