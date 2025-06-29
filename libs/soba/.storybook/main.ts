import { StorybookConfig } from '@storybook/angular';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
	stories: ['../**/*.mdx', '../**/*.stories.@(js|ts)'],

	addons: [
		getAbsolutePath('storybook-addon-deep-controls'),
		getAbsolutePath('@chromatic-com/storybook'),
		getAbsolutePath('@storybook/addon-docs'),
	],

	staticDirs: ['./public', './public/cube'],
	framework: getAbsolutePath('@storybook/angular'),

	webpackFinal: async (config) => {
		// Handle Node.js polyfills for webpack 5
		config.resolve = {
			...config.resolve,
			fallback: {
				...config.resolve?.fallback,
				fs: false,
				path: require.resolve('path-browserify'),
			},
		};
		return config;
	},
};

export default config;

function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, 'package.json')));
}
