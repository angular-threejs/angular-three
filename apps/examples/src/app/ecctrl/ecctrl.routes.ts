import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./wrapper'),
		children: [
			{
				path: 'basic',
				loadComponent: () => import('./basic/basic'),
				data: {
					credits: {
						title: 'Ecctrl',
						link: 'https://github.com/pmndrs/ecctrl',
					},
				},
			},
			{
				path: '',
				redirectTo: 'basic',
				pathMatch: 'full',
			},
		],
	},
];

export default routes;
