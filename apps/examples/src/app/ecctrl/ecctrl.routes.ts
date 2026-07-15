import { Routes } from '@angular/router';

export interface EcctrlExampleCanvasConfig {
	shadowExtent: number;
	shadowFar?: number;
	lighting?: 'shared' | 'scene';
}

export const ecctrlExampleRoutes: Routes = [
	{
		path: 'basic',
		loadComponent: () => import('./basic/basic'),
		data: {
			description:
				'A baseline third-person controller showing movement, jumping, running, animation states, and camera follow.',
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
			description:
				'Shows the controller staying grounded on translating and rotating kinematic platforms with followPlatform enabled.',
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
			description:
				'Applies a shared radial gravity field to the character and orbiting rigid bodies, including character-relative camera up.',
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
			description: 'Maps the same character movement model to a virtual joystick and run/jump touch buttons.',
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
			description:
				'Drives Rapier manually through NgteTimeControl so character physics and animation run together in slow motion.',
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
			description:
				'Edits the mass-ratio falloff curve live to tune how counter-impulses affect a dynamic platform.',
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
			description:
				'Builds a car from NgteEcctrlVehicle and four shape-cast wheels, including suspension, steering, drive, and braking.',
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
			description:
				'Builds a velocity-controlled drone from NgteEcctrlVehicle and four thrust propellers with yaw, pitch, and roll.',
			ecctrlCanvas: { shadowExtent: 24 } satisfies EcctrlExampleCanvasConfig,
			credits: {
				title: 'Ecctrl thrust-propeller drone',
				link: 'https://github.com/pmndrs/ecctrl',
				class: 'text-white',
			},
		},
	},
	{
		path: 'vehicle-drone-flight',
		loadComponent: () => import('./vehicle-drone-flight/vehicle-drone-flight'),
		data: {
			description:
				'Turns the Ecctrl drone into a flight-simulator experience with a locked chase camera, live FPV portal, and a procedural dusk city.',
			ecctrlCanvas: {
				shadowExtent: 52,
				shadowFar: 180,
				lighting: 'scene',
			} satisfies EcctrlExampleCanvasConfig,
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
