import { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
    stories: ['../**/*.mdx', '../**/*.stories.@(js|ts)'],

    addons: [
        'storybook-addon-deep-controls',
        '@chromatic-com/storybook',
        '@storybook/addon-docs'
    ],

    staticDirs: ['./public', './public/cube'],
    framework: '@storybook/angular'
};

export default config;
