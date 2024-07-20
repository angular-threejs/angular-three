import analogjsangular from '@analogjs/astro-angular';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	vite: {
		esbuild: {
			jsxDev: true,
		},
		// plugins: [
		// 	{
		// 		name: 'test',
		// 		enforce: 'post',
		// 		config: (config) => {
		// 			return { esbuild: { jsxDev: true } };
		// 		},
		// 	},
		// ],
	},
	integrations: [
		analogjsangular({
			vite: {
				experimental: {
					supportAnalogFormat: true,
				},
				// transformFilter: (code, id) => {
				// 	console.trace('in transform filter');
				// 	// console.log('in transform filter', {
				// 	// 	id,
				// 	// 	evaluated: id.includes('components') && !id.includes('astro') && !id.startsWith('\\x'),
				// 	// });
				// 	return false;
				// },
			},
		}),
		starlight({
			title: 'Angular Three',
			social: {
				github: 'https://github.com/angular-threejs/angular-three',
			},
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{
							label: 'Example Guide',
							slug: 'guides/example',
						},
					],
				},
				{
					label: 'Reference',
					autogenerate: {
						directory: 'reference',
					},
				},
			],
			expressiveCode: {
				themes: ['dark-plus', 'light-plus'],
				plugins: [pluginLineNumbers()],
			},
		}),
		tailwind(),
	],
});
