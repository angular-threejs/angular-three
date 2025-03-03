import { Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'basic',
		loadComponent: () => import('./basic/basic'),
	},
	{
		path: 'hud',
		loadComponent: () => import('./hud/hud'),
		data: {
			credits: {
				title: 'HUD',
				link: 'https://pmndrs.github.io/examples/demos/viewcube',
			},
		},
	},
	{
		path: 'render-texture',
		loadComponent: () => import('./render-texture/render-texture'),
		data: {
			credits: {
				title: 'Render Texture',
				link: 'https://codesandbox.io/p/sandbox/0z8i2c',
			},
		},
	},
	{
		path: 'shaky',
		loadComponent: () => import('./shaky/shaky'),
		data: {
			credits: {
				title: 'Camera Shake',
				link: 'https://pmndrs.github.io/examples/demos/camera-shake',
			},
		},
	},
	{
		path: 'lod',
		loadComponent: () => import('./lod/lod'),
		data: {
			credits: {
				title: 'LOD w/ reusing geometry',
				link: 'https://pmndrs.github.io/examples/demos/re-using-geometry-and-level-of-detail',
			},
		},
	},
	{
		path: 'decal',
		loadComponent: () => import('./decal/decal'),
		data: {
			credits: {
				title: 'Iridescent Decals',
				link: 'https://pmndrs.github.io/examples/demos/iridescent-decals',
			},
		},
	},
	// {
	// 	path: 'html-chart',
	// 	loadComponent: () => import('./html-chart/html-chart'),
	// },
	{
		path: 'lowpoly-earth',
		loadComponent: () => import('./lowpoly-earth/lowpoly-earth'),
		data: {
			credits: {
				title: 'Lowpoly Earth',
				link: 'https://pmndrs.github.io/examples/demos/html-markers',
			},
		},
	},
	{
		path: 'stars',
		loadComponent: () => import('./stars/stars'),
		data: {
			credits: {
				title: 'Stars',
				link: 'https://pmndrs.github.io/examples/demos/gatsby-stars',
				class: 'text-white',
			},
		},
	},
	{
		path: 'skydiving',
		loadComponent: () => import('./skydiving/skydiving'),
		data: {
			credits: {
				title: 'WebGL Skydiving',
				link: 'https://github.com/sebastien-lempens/webgl-skydiving',
			},
		},
	},
	{
		path: 'porsche',
		loadComponent: () => import('./porsche/porsche'),
		data: {
			credits: {
				title: 'Porsche Lighting',
				link: 'https://pmndrs.github.io/examples/demos/building-live-envmaps',
				class: 'left-2 text-white',
			},
		},
	},
	{
		path: 'instances',
		loadComponent: () => import('./instances/instances'),
		data: {
			credits: {
				title: 'Instances',
				link: 'https://pmndrs.github.io/examples/demos/instances',
				class: 'p-2 rounded border border-black bg-white',
			},
		},
	},
	{
		path: 'inverted-stencil-buffer',
		loadComponent: () => import('./inverted-stencil-buffer/inverted-stencil-buffer'),
		data: {
			credits: {
				title: 'Inverted Stencil Buffer',
				link: 'https://pmndrs.github.io/examples/demos/inverted-stencil-buffer',
				class: 'left-2',
			},
		},
	},
	{
		path: 'simple-sound-analyser',
		loadComponent: () => import('./simple-sound-analyser/simple-sound-analyser'),
		data: {
			credits: {
				title: 'Simple Sound Analyser',
				link: 'https://pmndrs.github.io/examples/demos/simple-audio-analyser',
			},
		},
	},
	{
		path: 'starbucks',
		loadComponent: () => import('./starbucks/starbucks'),
		data: {
			credits: {
				title: 'Decal and Pivot Controls',
				link: 'https://codesandbox.io/p/sandbox/om2ff8',
			},
		},
	},
	{
		path: 'bruno-simons-20k',
		loadComponent: () => import('./bruno-simons-20k/bruno-simons-20k'),
		data: {
			credits: {
				title: 'Bruno Simons 20k',
				link: 'https://pmndrs.github.io/examples/demos/bruno-simons-20k-challenge',
			},
		},
	},
	{
		path: 'instanced-vertex-colors',
		loadComponent: () => import('./instanced-vertex-colors/instanced-vertex-colors'),
		data: {
			credits: {
				title: 'Instanced Vertex Colors',
				link: 'https://pmndrs.github.io/examples/demos/instanced-vertex-colors',
				class: 'text-white',
			},
		},
	},
	{
		path: 'portal-shapes',
		loadComponent: () => import('./portal-shapes/portal-shapes'),
		data: {
			credits: {
				title: 'Portal Shapes',
				link: 'https://pmndrs.github.io/examples/demos/portal-shapes',
			},
		},
	},
	{
		path: 'backdrop-cable',
		loadComponent: () => import('./backdrop-cable/backdrop-cable'),
		data: {
			credits: {
				title: 'Backdrop Cable',
				link: 'https://pmndrs.github.io/examples/demos/backdrop-and-cables',
				class: 'text-white',
			},
		},
	},
	{
		path: 'aquarium',
		loadComponent: () => import('./aquarium/aquarium'),
		data: {
			credits: {
				title: 'Aquarium',
				link: 'https://pmndrs.github.io/examples/demos/aquarium',
			},
		},
	},
	{
		path: 'camera-scroll',
		loadComponent: () => import('./camera-scroll/camera-scroll'),
		data: {
			credits: {
				title: 'Camera Scroll',
				link: 'https://pmndrs.github.io/examples/demos/camera-scroll',
				class: 'text-white',
			},
		},
	},
	{
		path: 'baking-soft-shadows',
		loadComponent: () => import('./baking-soft-shadows/baking-soft-shadows'),
		data: {
			credits: {
				title: 'Baking Soft Shadows',
				link: 'https://pmndrs.github.io/examples/demos/baking-soft-shadows',
			},
		},
	},
	{
		path: 'epoxy-resin',
		loadComponent: () => import('./epoxy-resin/epoxy-resin'),
		data: {
			credits: {
				title: 'Epoxy Resin',
				link: 'https://pmndrs.github.io/examples/demos/inter-epoxy-resin',
			},
		},
	},
	{
		path: 'shoe-configuration',
		loadComponent: () => import('./shoe-configuration/shoe-configuration'),
		data: {
			credits: {
				title: 'Shoe Configuration',
				link: 'https://pmndrs.github.io/examples/demos/shoe-configurator',
			},
		},
	},
	{
		path: '',
		redirectTo: 'stars',
		pathMatch: 'full',
	},
];

export default routes;
