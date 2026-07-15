import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'basic',
		loadComponent: () => import('./basic/basic'),
		data: {
			credits: {
				title: 'Ecctrl',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
	{
		path: 'moving-platform',
		loadComponent: () => import('./moving-platform/moving-platform'),
		data: {
			credits: {
				title: 'Ecctrl TestMap',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
	{
		path: 'gravity-field',
		loadComponent: () => import('./gravity-field/gravity-field'),
		data: {
			credits: {
				title: 'Ecctrl GravityField',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
	{
		path: 'mobile-input',
		loadComponent: () => import('./mobile-input/mobile-input'),
		data: {
			credits: {
				title: 'Ecctrl touch input',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
	{
		path: 'time-control',
		loadComponent: () => import('./time-control/time-control'),
		data: {
			credits: {
				title: 'Ecctrl time control',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
	{
		path: 'curve-editor',
		loadComponent: () => import('./curve-editor/curve-editor'),
		data: {
			credits: {
				title: 'Ecctrl curve editor',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
	{
		path: 'vehicle-car',
		loadComponent: () => import('./vehicle-car/vehicle-car'),
		data: {
			credits: {
				title: 'Ecctrl shape-cast vehicle',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
	{
		path: 'vehicle-drone',
		loadComponent: () => import('./vehicle-drone/vehicle-drone'),
		data: {
			credits: {
				title: 'Ecctrl thrust-propeller drone',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
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
