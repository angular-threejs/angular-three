import analogjsangular from '@analogjs/astro-angular';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

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
				'angular-three-cannon',
				'angular-three-cannon/**',
				'angular-three-rapier',
				'angular-three-rapier/**',
				'angular-three-postprocessing',
				'angular-three-postprocessing/**',
				'@angular/common',
				'@angular/core',
				'@angular/core/rxjs-interop',
				'ngxtension/**',
				'@pmndrs/vanilla',
				'@pmndrs/cannon-worker-api',
				'three-custom-shader-material',
			],
		},
		esbuild: {
			jsxDev: true,
		},
		plugins: [includeContentPlugin()],
	},
	integrations: [
		analogjsangular(),
		starlight({
			title: 'Angular Three',
			plugins: [
				// starlightBlog({
				// 	authors: {
				// 		chau: {
				// 			name: 'Chau Tran',
				// 			url: 'https://nartc.me',
				// 			picture: 'https://avatars.githubusercontent.com/u/25516557?v=4',
				// 		},
				// 	},
				// }),
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
			customCss: ['./src/tailwind.css'],
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
		tailwind({ applyBaseStyles: false }),
	],
});
