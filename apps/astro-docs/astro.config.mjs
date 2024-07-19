import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [
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
