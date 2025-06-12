import { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
    stories: ['../**/*.mdx', '../**/*.stories.@(js|ts)'],

    addons: [
        'storybook-addon-deep-controls',
        '@chromatic-com/storybook',
        '@storybook/addon-docs'
    ],

    staticDirs: ['./public', './public/cube'],
    framework: '@storybook/angular',
    
    webpackFinal: async (config) => {
        // Handle Node.js polyfills for webpack 5
        config.resolve = {
            ...config.resolve,
            fallback: {
                ...config.resolve?.fallback,
                fs: false,
                path: require.resolve('path-browserify')
            }
        };
        return config;
    }
};

export default config;
