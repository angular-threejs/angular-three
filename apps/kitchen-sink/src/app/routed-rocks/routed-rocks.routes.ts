import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'rocks',
		loadComponent: () => import('./rocks'),
		loadChildren: () => import('./rocks.routes'),
	},
	{
		path: '',
		redirectTo: 'rocks',
		pathMatch: 'full',
	},
];

export default routes;
