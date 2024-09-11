import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: ':scene',
		loadComponent: () => import('./wrapper'),
	},
	{
		path: '',
		redirectTo: 'basic',
		pathMatch: 'full',
	},
];

export default routes;
