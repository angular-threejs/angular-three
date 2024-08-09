import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'basic',
		loadComponent: () => import('./basic/basic'),
	},
	{
		path: 'hud',
		loadComponent: () => import('./hud/hud'),
	},
	{
		path: 'render-texture',
		loadComponent: () => import('./render-texture/render-texture'),
	},
	{
		path: 'shaky',
		loadComponent: () => import('./shaky/shaky'),
	},
	{
		path: 'lod',
		loadComponent: () => import('./lod/lod'),
	},
	{
		path: 'decal',
		loadComponent: () => import('./decal/decal'),
	},
	{
		path: 'html-chart',
		loadComponent: () => import('./html-chart/html-chart'),
	},
	{
		path: 'lowpoly-earth',
		loadComponent: () => import('./lowpoly-earth/lowpoly-earth'),
	},
	{
		path: 'stars',
		loadComponent: () => import('./stars/stars'),
	},
	{
		path: '',
		redirectTo: 'basic',
		pathMatch: 'full',
	},
];

export default routes;
