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
		path: 'webgpu-renderer',
		loadComponent: () => import('./webgpu-renderer/webgpu-renderer'),
		data: {
			credits: {
				title: "Threlte's WebGPU Renderer example",
				link: 'https://threlte.xyz/docs/learn/advanced/webgpu',
			},
		},
	},
	{
		path: 'webgpu-tsl',
		loadComponent: () => import('./webgpu-tsl/webgpu-tsl'),
		data: {
			credits: {
				title: "Threlte's WebGPU TSL example",
				link: 'https://threlte.xyz/docs/learn/advanced/webgpu#tsl',
			},
		},
	},
	{
		path: 'particle-maxime',
		loadComponent: () => import('./particle-maxime/particle-maxime'),
		data: {
			credits: {
				title: 'The magical world of particles with React Three Fiber and shaders',
				link: 'https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/',
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
