import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./wrapper'),
		children: [
			{
				path: 'basic',
				loadComponent: () => import('./basic/basic'),
			},
			{
				path: 'rope-joint',
				loadComponent: () => import('./rope-joint/rope-joint'),
			},
			{
				path: 'spring',
				loadComponent: () => import('./spring/spring'),
			},
			{
				path: 'cluster',
				loadComponent: () => import('./cluster/cluster'),
			},
			{
				path: 'instanced-mesh',
				loadComponent: () => import('./instanced-mesh/instanced-mesh'),
			},
			{
				path: 'joints',
				loadComponent: () => import('./joints/joints'),
			},
			{
				path: 'performance',
				loadComponent: () => import('./performance/performance'),
			},
			{
				path: '',
				redirectTo: 'basic',
				pathMatch: 'full',
			},
		],
		data: {
			credits: {
				title: 'React Three Rapier',
				link: 'https://react-three-rapier.pmnd.rs',
				class: 'left-2',
			},
		},
	},
];

export default routes;
