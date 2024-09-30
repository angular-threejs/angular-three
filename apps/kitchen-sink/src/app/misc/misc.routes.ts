import { Routes } from '@angular/router';

const routes: Routes = [
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
		path: 'aviator',
		loadComponent: () => import('./aviator/aviator'),
		data: {
			credits: {
				title: 'The Aviator',
				link: 'https://github.com/yakudoo/TheAviator',
				class: 'text-white',
			},
		},
	},
	{
		path: '',
		redirectTo: 'svg-renderer',
		pathMatch: 'full',
	},
];

export default routes;
