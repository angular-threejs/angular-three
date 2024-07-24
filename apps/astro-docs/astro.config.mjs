import analogjsangular from '@analogjs/astro-angular';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	vite: {
		ssr: {
			noExternal: [
				'angular-three',
				'angular-three-soba/**',
				'@angular/common',
				'@angular/core',
				'@angular/core/rxjs-interop',
				'ngxtension/**',
			],
		},
		esbuild: {
			jsxDev: true,
		},
	},
	integrations: [
		analogjsangular({
			vite: {
				experimental: {
					supportAnalogFormat: true,
				},
			},
		}),
		starlight({
			title: 'Angular Three',
			favicon: './src/assets/angular-three-dark.svg',
			tableOfContents: {
				minHeadingLevel: 2,
				maxHeadingLevel: 4,
			},
			logo: {
				light: './src/assets/angular-three.svg',
				dark: './src/assets/angular-three-dark.svg',
			},
			social: {
				github: 'https://github.com/angular-threejs/angular-three',
			},
			customCss: ['./src/tailwind.css'],
			sidebar: [
				{
					label: 'Introduction',
					slug: '',
				},
				{
					label: 'Core',
					items: [
						{
							label: 'Getting Started',
							items: [
								{
									label: 'Installation',
									slug: 'core/getting-started/installation',
								},
								{
									label: 'Editor Setup',
									slug: 'core/getting-started/editor-setup',
								},
								{
									label: 'First Scene',
									slug: 'core/getting-started/first-scene',
								},
							],
						},
						{
							label: 'API',
							items: [
								{
									label: 'NgtCanvas',
									slug: 'core/api/canvas',
								},
								{
									label: 'Custom Renderer',
									slug: 'core/api/custom-renderer',
								},
								{
									label: 'NgtArgs',
									slug: 'core/api/args',
								},
								{
									label: 'Primitive',
									slug: 'core/api/primitive',
								},
								{
									label: 'Raw Value',
									slug: 'core/api/raw-value',
								},
							],
						},
					],
				},
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
		tailwind({
			applyBaseStyles: false,
		}),
	],
});
