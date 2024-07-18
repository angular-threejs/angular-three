const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('node:path');
const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html,analog}'), ...createGlobPatternsForDependencies(__dirname)],
	theme: {
    fontFamily: {
      sans: [ 'Noto Sans', ...defaultTheme.fontFamily.sans],
    },
		extend: {
    },
	},
	plugins: [],
};
