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
		path: 'test',
		loadComponent: () => import('./test/test'),
	},
	{
		path: 'render-texture',
		loadComponent: () => import('./render-texture/render-texture'),
	},
	{
		path: '',
		redirectTo: 'basic',
		pathMatch: 'full',
	},
];

export default routes;
