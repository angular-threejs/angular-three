import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'red',
		loadComponent: () => import('./red-cube'),
	},
	{
		path: 'blue',
		loadComponent: () => import('./blue-cube'),
	},
	{
		path: '',
		redirectTo: 'red',
		pathMatch: 'full',
	},
];

export default routes;
