import { Routes } from '@angular/router';

export interface EcctrlExampleCanvasConfig {
	shadowExtent: number;
	shadowFar?: number;
}

export const ecctrlExampleRoutes: Routes = [
	{
		path: 'basic',
		loadComponent: () => import('./basic/basic'),
		data: {
			ecctrlCanvas: { shadowExtent: 12 } satisfies EcctrlExampleCanvasConfig,
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
			ecctrlCanvas: { shadowExtent: 18 } satisfies EcctrlExampleCanvasConfig,
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
			ecctrlCanvas: { shadowExtent: 14 } satisfies EcctrlExampleCanvasConfig,
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
			ecctrlCanvas: { shadowExtent: 16 } satisfies EcctrlExampleCanvasConfig,
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
			ecctrlCanvas: { shadowExtent: 16, shadowFar: 60 } satisfies EcctrlExampleCanvasConfig,
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
			ecctrlCanvas: { shadowExtent: 16 } satisfies EcctrlExampleCanvasConfig,
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
			ecctrlCanvas: { shadowExtent: 22 } satisfies EcctrlExampleCanvasConfig,
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
			ecctrlCanvas: { shadowExtent: 24 } satisfies EcctrlExampleCanvasConfig,
			credits: {
				title: 'Ecctrl thrust-propeller drone',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
];

const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./wrapper'),
		children: [
			...ecctrlExampleRoutes,
			{
				path: '',
				redirectTo: 'basic',
				pathMatch: 'full',
			},
		],
	},
];

export default routes;
