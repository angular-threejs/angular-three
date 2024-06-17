import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'basic',
		loadComponent: () => import('./basic/basic'),
	},
	{
		path: 'kinematic-cube',
		loadComponent: () => import('./kinematic-cube/kinematic-cube'),
	},
	{
		path: 'compound',
		loadComponent: () => import('./compound/compound'),
	},
	{
		path: '',
		redirectTo: 'basic',
		pathMatch: 'full',
	},
];

export default routes;
