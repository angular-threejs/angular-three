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
		path: 'convexpolyhedron',
		loadComponent: () => import('./convexpolyhedron/convexpolyhedron'),
	},
	{
		path: 'monday-morning',
		loadComponent: () => import('./monday-morning/monday-morning'),
	},
	{
		path: '',
		redirectTo: 'basic',
		pathMatch: 'full',
	},
];

export default routes;
