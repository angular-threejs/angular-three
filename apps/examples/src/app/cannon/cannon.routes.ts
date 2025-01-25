import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'basic',
		loadComponent: () => import('./basic/basic'),
	},
	{
		path: 'kinematic-cube',
		loadComponent: () => import('./kinematic-cube/kinematic-cube'),
		data: {
			credits: {
				title: 'Kinematic Cube',
				link: 'https://cannon.pmnd.rs/#/demo/KinematicCube',
			},
		},
	},
	{
		path: 'compound',
		loadComponent: () => import('./compound/compound'),
		data: {
			credits: {
				title: 'Compound Body',
				link: 'https://cannon.pmnd.rs/#/demo/CompoundBody',
			},
		},
	},
	{
		path: 'chain',
		loadComponent: () => import('./chain/chain'),
		data: {
			credits: {
				title: 'Chain',
				link: 'https://cannon.pmnd.rs/#/demo/Chain',
				class: 'text-white',
			},
		},
	},
	{
		path: 'cube-heap',
		loadComponent: () => import('./cube-heap/cube-heap'),
		data: {
			credits: {
				title: 'Cube Heap',
				link: 'https://cannon.pmnd.rs/#/demo/CubeHeap',
			},
		},
	},
	{
		path: 'convexpolyhedron',
		loadComponent: () => import('./convexpolyhedron/convexpolyhedron'),
		data: {
			credits: {
				title: 'Convex Polyhedron',
				link: 'https://cannon.pmnd.rs/#/demo/ConvexPolyhedron',
			},
		},
	},
	{
		path: 'monday-morning',
		loadComponent: () => import('./monday-morning/monday-morning'),
		data: {
			credits: {
				title: 'Monday Morning',
				link: 'https://cannon.pmnd.rs/#/demo/MondayMorning',
				class: 'text-white',
			},
		},
	},
	{
		path: '',
		redirectTo: 'basic',
		pathMatch: 'full',
	},
];

export default routes;
