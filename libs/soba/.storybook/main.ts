import { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
	stories: ['../**/*.mdx', '../**/*.stories.@(js|ts)'],
	addons: ['@storybook/addon-essentials', 'storybook-addon-deep-controls', '@chromatic-com/storybook'],
	staticDirs: ['./public', './public/cube'],
	framework: '@storybook/angular',
	docs: {
        autodocs: true
    },
};

export default config;
