import analogjsangular from '@analogjs/astro-angular';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import starlightBlog from 'starlight-blog';

function includeContentPlugin() {
	const map = new Map();

	return [
		{
			name: 'pre-include-content',
			enforce: 'pre',
			transform(_, id) {
				if (!id.includes('?includeContent') || id.includes('astro-entry')) return;

				const [filePath] = id.split('?');
				const fileContent = readFileSync(filePath, 'utf-8');

				if (map.has(filePath)) return;
				map.set(filePath, fileContent.replace(/\t/g, '  '));
			},
		},
		{
			name: 'post-include-content',
			enforce: 'post',
			transform(code, id) {
				if (!id.includes('?includeContent') || id.includes('astro-entry')) return;
				const [filePath] = id.split('?');
				const fileContent = map.get(filePath);

				return {
					code: `
            ${code}
            export const content = ${JSON.stringify(fileContent)};
          `,
				};
			},
		},
	];
}

// https://astro.build/config
export default defineConfig({
	vite: {
		ssr: {
			noExternal: [
				'angular-three',
				'angular-three-soba/**',
				'angular-three-cannon/**',
				'@angular/common',
				'@angular/core',
				'@angular/core/rxjs-interop',
				'ngxtension/**',
				'@pmndrs/vanilla',
				'@pmndrs/cannon-worker-api',
			],
		},
		esbuild: {
			jsxDev: true,
		},
		plugins: [includeContentPlugin()],
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
			plugins: [
				starlightBlog({
					authors: {
						chau: {
							name: 'Chau Tran',
							url: 'https://nartc.me',
							picture: 'https://avatars.githubusercontent.com/u/25516557?v=4',
						},
					},
				}),
			],
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
			credits: true,
			customCss: ['./src/tailwind.css'],
			sidebar: [
				{ label: 'Introduction', slug: '' },
				{
					label: 'Core',
					collapsed: true,
					items: [
						{
							label: 'Getting Started',
							collapsed: true,
							items: [
								{ label: 'Installation', slug: 'core/getting-started/installation' },
								{ label: 'Editor Setup', slug: 'core/getting-started/editor-setup' },
								{ label: 'First Scene', slug: 'core/getting-started/first-scene' },
							],
						},
						{ label: 'Migrate to v2', slug: 'core/migrate-v2' },
						{
							label: 'API',
							collapsed: true,
							items: [
								{ label: 'NgtCanvas', slug: 'core/api/canvas' },
								{ label: 'Custom Renderer', slug: 'core/api/custom-renderer' },
								{ label: 'NgtArgs', slug: 'core/api/args' },
								{ label: 'Primitive', slug: 'core/api/primitive' },
								{ label: 'Raw Value', slug: 'core/api/raw-value' },
								{ label: 'Store', slug: 'core/api/store' },
							],
						},
						{
							label: 'Testing',
							collapsed: true,
							badge: { text: 'Preview', variant: 'caution' },
							items: [
								{ label: 'Introduction', slug: 'core/testing/introduction' },
								{ label: 'NgtTestBed', slug: 'core/testing/test-bed' },
								{ label: 'fireEvent', slug: 'core/testing/fire-event' },
								{ label: 'advance', slug: 'core/testing/advance' },
								{ label: 'toGraph', slug: 'core/testing/to-graph' },
							],
						},
						{
							label: 'Utilities',
							collapsed: true,
							items: [
								{ label: 'injectBeforeRender', slug: 'core/utilities/before-render' },
								{ label: 'injectLoader', slug: 'core/utilities/loader' },
							],
						},
						{
							label: 'Advanced',
							collapsed: true,
							items: [
								{ label: 'Directives', slug: 'core/advanced/directives' },
								{ label: 'Portals', slug: 'core/advanced/portals' },
								{
									label: 'Routed Scene',
									slug: 'core/advanced/routed-scene',
									badge: { text: 'Bug', variant: 'danger' },
								},
								{ label: 'Performance', slug: 'core/advanced/performance' },
							],
						},
					],
				},
				{
					label: 'Soba',
					collapsed: true,
					items: [{ label: 'Introduction', slug: 'soba/introduction' }],
				},
				{
					label: 'Cannon',
					collapsed: true,
					items: [
						{ label: 'Introduction', slug: 'cannon/introduction' },
						{ label: 'How it works', slug: 'cannon/how-it-works' },
						{ label: 'Debug', slug: 'cannon/debug' },
					],
				},
				{
					label: 'Postprocessing',
					collapsed: true,
					items: [
						{ label: 'Introduction', slug: 'postprocessing/introduction' },
						{ label: 'How it works', slug: 'postprocessing/how-it-works' },
					],
				},
				{
					label: 'Demo',
					link: 'https://demo.angularthree.org',
				},
			],
		}),
		tailwind({ applyBaseStyles: false }),
	],
});
