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
		path: 'chain',
		loadComponent: () => import('./chain/chain'),
	},
	{
		path: 'cube-heap',
		loadComponent: () => import('./cube-heap/cube-heap'),
	},
	{
		path: '',
		redirectTo: 'basic',
		pathMatch: 'full',
	},
];

export default routes;
