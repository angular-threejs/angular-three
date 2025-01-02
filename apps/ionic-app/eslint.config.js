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
				'@angular-eslint/directive-selector': [
					'error',
					{
						type: 'attribute',
						prefix: 'platform',
						style: 'camelCase',
					},
				],
				'@angular-eslint/component-selector': [
					'error',
					{
						type: 'element',
						prefix: 'platform',
						style: 'kebab-case',
					},
				],
				'@angular-eslint/component-class-suffix': [
					'error',
					{
						suffixes: ['Page', 'Component'],
					},
				],
				'@angular-eslint/no-empty-lifecycle-method': 0,
				'@typescript-eslint/no-empty-function': 0,
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
		files: ['**/*.ts'],
		rules: {
			'@angular-eslint/prefer-standalone': 'off',
		},
	},
];
