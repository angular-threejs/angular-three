import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'basic',
		loadComponent: () => import('./basic/basic'),
	},
	{
		path: 'svg-renderer',
		loadComponent: () => import('./svg-renderer/svg-renderer'),
		data: {
			credits: {
				title: 'SVG Renderer w/ Lines',
				link: 'https://threejs.org/examples/#svg_lines',
				class: 'text-white',
			},
		},
	},
	{
		path: 'pointer-events',
		loadComponent: () => import('./pointer-events/pointer-events'),
		data: {
			credits: {
				title: 'Pointer Events',
				link: 'https://docs.tresjs.org/api/events.html',
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
