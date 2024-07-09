import { Routes } from '@angular/router';

export const appRoutes: Routes = [
	{
		path: 'home',
		loadChildren: () => import('./home/home.routes').then((r) => r.routes),
	},
	{
		path: '',
		redirectTo: 'home',
		pathMatch: 'full',
	},
];
