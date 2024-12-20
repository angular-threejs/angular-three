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
			rules: {
				...config.rules,
				'@angular-eslint/directive-class-suffix': 'off',
				'@angular-eslint/component-class-suffix': 'off',
				'@typescript-eslint/no-unused-vars': [
					'warn',
					{
						argsIgnorePattern: '^_',
						varsIgnorePattern: '^_',
					},
				],
			},
		})),
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
						'@angular/common',
						'@nx/vite',
						'angular-three',
						'ngxtension',
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
];
