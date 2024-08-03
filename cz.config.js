/** @type {import('cz-git').UserConfig['prompt']} */
module.exports = {
	types: [
		{ value: 'feat', name: 'feat:     A new feature', emoji: ':sparkles:' },
		{ value: 'fix', name: 'fix:      A bug fix', emoji: ':bug:' },
		{ value: 'docs', name: 'docs:     Documentation only changes', emoji: ':memo:' },
		{
			value: 'refactor',
			name: 'refactor: A code change that neither fixes a bug nor adds a feature',
			emoji: ':recycle:',
		},
		{ value: 'perf', name: 'perf:     A code change that improves performance', emoji: ':zap:' },
		{
			value: 'testing',
			name: 'testing:     Adding missing tests or correcting existing tests',
			emoji: ':white_check_mark:',
		},
		{ value: 'chore', name: "chore:    Other changes that don't modify src or test files", emoji: ':hammer:' },
	],
	scopes: [
		{ name: 'core' },
		{ name: 'soba' },
		{ name: 'cannon' },
		{ name: 'postprocessing' },
		{ name: 'plugin' },
		{ name: 'docs' },
		{ name: 'testing' },
	],
};
