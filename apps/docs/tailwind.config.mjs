import starlightPlugin from '@astrojs/starlight-tailwind';

// Generated color palettes - oxide
const accent = { 200: '#feb3a6', 600: '#a60a00', 900: '#640300', 950: '#460b05' };
const gray = {
	100: '#f9f5f5',
	200: '#f3ecea',
	300: '#c8c0be',
	400: '#978784',
	500: '#635451',
	700: '#423432',
	800: '#302321',
	900: '#1d1715',
};

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: { accent, gray },
		},
	},
	plugins: [starlightPlugin()],
};
