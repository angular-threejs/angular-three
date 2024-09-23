import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'svg-renderer',
		loadComponent: () => import('./svg-renderer/svg-renderer'),
	},
	{
		path: 'aviator',
		loadComponent: () => import('./aviator/aviator'),
	},
	{
		path: '',
		redirectTo: 'svg-renderer',
		pathMatch: 'full',
	},
];

export default routes;
