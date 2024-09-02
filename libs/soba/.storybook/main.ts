import { StorybookConfig } from '@storybook/angular';
import { StorybookConfigVite } from '@storybook/builder-vite';
import { UserConfig } from 'vite';

const config: StorybookConfig & StorybookConfigVite = {
	stories: ['../**/*.mdx', '../**/*.stories.@(js|ts)'],
	addons: ['@storybook/addon-essentials', 'storybook-addon-deep-controls', '@chromatic-com/storybook'],
	core: {
		builder: {
			name: '@storybook/builder-vite',
			options: {
				viteConfigPath: undefined,
			},
		},
	},
	async viteFinal(config: UserConfig) {
		// Merge custom configuration into the default config
		const { mergeConfig } = await import('vite');
		const { default: angular } = await import('@analogjs/vite-plugin-angular');
		const { nxViteTsPaths } = await import('@nx/vite/plugins/nx-tsconfig-paths.plugin');

		return mergeConfig(config, {
			// Add dependencies to pre-optimization
			optimizeDeps: {
				include: [
					'@storybook/angular',
					'@storybook/angular/dist/client',
					'@angular/compiler',
					'@mdx-js/react',
					'@storybook/blocks',
					'tslib',
				],
			},
			plugins: [angular({ jit: true, tsconfig: './.storybook/tsconfig.json' }), nxViteTsPaths()],
		});
	},
	staticDirs: ['./public', './public/cube'],
	framework: {
		name: '@storybook/angular',
		options: {},
	},
	docs: {},
};

export default config;
