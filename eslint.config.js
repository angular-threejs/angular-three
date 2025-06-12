// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const nxEslintPlugin = require('@nx/eslint-plugin');

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
});

module.exports = [
	{ plugins: { '@nx': nxEslintPlugin } },
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
		rules: {
			'@nx/enforce-module-boundaries': [
				'error',
				{
					enforceBuildableLibDependency: true,
					allow: [],
					depConstraints: [
						{
							sourceTag: '*',
							onlyDependOnLibsWithTags: ['*'],
						},
					],
				},
			],
		},
	},
	...compat
		.config({
			extends: ['plugin:@nx/typescript'],
		})
		.map((config) => ({
			...config,
			files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
			rules: {
				...config.rules,
				'@typescript-eslint/no-extra-semi': 'error',
				'no-extra-semi': 'off',
			},
		})),
	...compat
		.config({
			extends: ['plugin:@nx/javascript'],
		})
		.map((config) => ({
			...config,
			files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
			rules: {
				...config.rules,
				'@typescript-eslint/no-extra-semi': 'error',
				'no-extra-semi': 'off',
			},
		})),
	...compat
		.config({
			env: {
				jest: true,
			},
		})
		.map((config) => ({
			...config,
			files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
			rules: {
				...config.rules,
			},
		})),
	{
		files: ['**/*.json'],
		// Override or add rules here
		rules: {},
		languageOptions: {
			parser: require('jsonc-eslint-parser'),
		},
	},
	{
		files: ['**/*.ts'],
		rules: {
			'@angular-eslint/prefer-standalone': 'off',
		},
	},
	{
		ignores: ['**/vite.config.*.timestamp*', '**/vitest.config.*.timestamp*'],
	},
];
