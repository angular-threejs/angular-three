import { Routes } from '@angular/router';

const rockRoutes: Routes = [
	{
		path: ':colorId',
		loadComponent: () => import('./colored-rock'),
	},
];

export default rockRoutes;
