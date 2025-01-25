import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: ':scene',
		loadComponent: () => import('./wrapper'),
		data: {
			credits: {
				title: 'React Three Rapier',
				link: 'https://react-three-rapier.pmnd.rs',
				class: 'left-2',
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
