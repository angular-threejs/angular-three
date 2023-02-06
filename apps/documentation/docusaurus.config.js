// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const isDevelopment = process.env.NODE_ENV === 'development';

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Angular Three',
    tagline: 'Custom Renderer for THREE.js',
    url: 'https://angular-threejs.netlify.app',
    baseUrl: '/',
    onBrokenLinks: 'ignore',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/ngt-logo.png',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'angular-threejs', // Usually your GitHub org/user name.
    projectName: 'angular-three', // Usually your repo name.

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    //    i18n: {
    //        defaultLocale: 'en',
    //        locales: ['en'],
    //    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: 'https://github.com/angular-threejs/angular-three/tree/main/apps/documentation',
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: 'https://github.com/angular-threejs/angular-three/tree/main/apps/documentation',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                title: 'Angular Three',
                logo: {
                    alt: 'Angular Three logo with Angular shield and THREE.js triangles',
                    src: 'img/ngt-logo.svg',
                },
                items: [
                    {
                        type: 'doc',
                        docId: 'getting-started/introduction',
                        position: 'left',
                        label: 'Documentation',
                    },
                    {
                        href: 'https://angular-threejs-demo.netlify.app/',
                        position: 'left',
                        label: 'Demo',
                    },
                    {
                        href: 'https://angular-threejs-soba.netlify.app/',
                        position: 'left',
                        label: 'Soba Storybook',
                    },
                    // TODO  re-enable for blogs
                    // { to: '/blog', label: 'Blog', position: 'left' },
                    {
                        href: 'https://github.com/angular-threejs/angular-three',
                        label: 'GitHub',
                        position: 'right',
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Docs',
                        items: [
                            {
                                label: 'Documentation',
                                to: '/docs/getting-started/introduction',
                            },
                        ],
                    },
                    {
                        title: 'Community',
                        items: [
                            {
                                label: 'Stack Overflow',
                                href: 'https://stackoverflow.com/questions/tagged/angular-three',
                            },
                            {
                                label: 'Twitter',
                                href: 'https://twitter.com/Nartc1410',
                            },
                        ],
                    },
                    {
                        title: 'More',
                        items: [
                            //                            {
                            //                                label: 'Blog',
                            //                                to: '/blog',
                            //                            },
                            {
                                label: 'GitHub',
                                href: 'https://github.com/angular-threejs/angular-three',
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Angular Three, Inc. Built with Docusaurus.`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
        }),
};

module.exports = config;
