import { Routes } from '@angular/router';
import { provideResetOrbitControls } from './reset-orbit-controls';

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
				providers: [provideResetOrbitControls(50, [0, 0.25, 0.75])],
				loadComponent: () => import('./rope-joint/rope-joint'),
			},
			{
				path: 'spring',
				providers: [provideResetOrbitControls(8)],
				loadComponent: () => import('./spring/spring'),
			},
			{
				path: 'cluster',
				loadComponent: () => import('./cluster/cluster'),
			},
			{
				path: 'instanced-mesh',
				providers: [provideResetOrbitControls(30)],
				loadComponent: () => import('./instanced-mesh/instanced-mesh'),
			},
			{
				path: 'joints',
				loadComponent: () => import('./joints/joints'),
			},
			{
				path: 'performance',
				providers: [provideResetOrbitControls(15)],
				loadComponent: () => import('./performance/performance'),
			},
			{
				path: 'all-colliders',
				providers: [provideResetOrbitControls(30)],
				loadComponent: () => import('./all-colliders/all-colliders'),
			},
			{
				path: 'sensors',
				providers: [provideResetOrbitControls(30)],
				loadComponent: () => import('./sensors/sensors'),
			},
			{
				path: 'contact-force-events',
				providers: [provideResetOrbitControls(10)],
				loadComponent: () => import('./contact-force-events/contact-force-events'),
			},
			{
				path: 'active-collision-types',
				providers: [provideResetOrbitControls(10)],
				loadComponent: () => import('./active-collision-types/active-collision-types'),
			},
			{
				path: 'attractors',
				providers: [provideResetOrbitControls(40)],
				loadComponent: () => import('./attractors/attractors'),
			},
			{
				path: 'kinematics',
				providers: [provideResetOrbitControls(30)],
				loadComponent: () => import('./kinematics/kinematics'),
			},
			{
				path: 'car',
				providers: [provideResetOrbitControls(30)],
				loadComponent: () => import('./car/car'),
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
