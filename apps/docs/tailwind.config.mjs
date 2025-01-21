import starlightPlugin from '@astrojs/starlight-tailwind';
import defaultTheme from 'tailwindcss/defaultTheme';

// Generated color palettes - nebula
const accent = { 200: '#e3b6ed', 600: '#8b00a3', 900: '#4e0e5b', 950: '#36113e' };
const gray = {
	100: '#f8f4fe',
	200: '#f2e9fd',
	300: '#c7bdd5',
	400: '#9581ae',
	500: '#614e78',
	700: '#412e55',
	800: '#2f1c42',
	900: '#1c1425',
};

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: { accent, gray },
			fontFamily: {
				sans: ['Inter', ...defaultTheme.fontFamily.sans],
				mono: ['DM Mono', ...defaultTheme.fontFamily.mono],
			},
		},
	},
	plugins: [starlightPlugin()],
};
