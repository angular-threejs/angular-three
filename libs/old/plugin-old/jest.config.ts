/* eslint-disable */
export default {
	displayName: 'plugin-old',
	preset: '../../../jest.preset.js',
	transform: {
		'^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
	},
	moduleFileExtensions: ['ts', 'js', 'html'],
	coverageDirectory: '../../../coverage/libs/old/plugin-old',
};
