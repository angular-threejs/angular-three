const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const baseConfig = require('../../eslint.config.js');

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
});

module.exports = [
	...baseConfig,
	...compat
		.config({
			extends: ['plugin:@nx/angular', 'plugin:@angular-eslint/template/process-inline-templates'],
		})
		.map((config) => ({
			...config,
			files: ['**/*.ts'],
			files: ['**/*.ts'],
			rules: {
				'@angular-eslint/directive-selector': 'off',
				'@angular-eslint/component-selector': 'off',
				'@angular-eslint/component-class-suffix': 'off',
				'@angular-eslint/directive-class-suffix': 'off',
				'@angular-eslint/no-input-rename': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-empty-function': 'off',
				'@typescript-eslint/no-non-null-assertion': 'off',
				'@typescript-eslint/ban-types': 'off',
				'@typescript-eslint/no-empty-interface': 'off',
				'@typescript-eslint/no-unused-vars': [
					'warn',
					{
						argsIgnorePattern: '^_',
						varsIgnorePattern: '^_',
					},
				],
			},
		})),
	{
		files: ['**/*.spec.ts'],
		rules: {
			'@nx/enforce-module-boundaries': 'off',
		},
	},
	{
		files: ['web-gl-rendering-context.ts'],
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off',
		},
	},
	...compat
		.config({
			extends: ['plugin:@nx/angular-template'],
		})
		.map((config) => ({
			...config,
			files: ['**/*.html'],
			rules: {
				...config.rules,
			},
		})),
	{
		files: ['**/*.json'],
		rules: {
			'@nx/dependency-checks': [
				'error',
				{
					ignoredDependencies: [
						'@analogjs/vite-plugin-angular',
						'@angular/router',
						'@nx/devkit',
						'@nx/vite',
						'@phenomnomnominal/tsquery',
						'nx',
						'rxjs',
						'tslib',
						'vite',
					],
				},
			],
		},
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
];
