import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./home.page').then((p) => p.HomePage),
	},
];
