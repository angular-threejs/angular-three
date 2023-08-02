import {
	addDependenciesToPackageJson,
	installPackagesTask,
	logger,
	readJson,
	updateJson,
	writeJson,
	type Tree,
} from '@nx/devkit';
import { ANGULAR_THREE_VERSION, THREE_TYPE_VERSION, THREE_VERSION } from '../versions';

export default async function (tree: Tree) {
	logger.log('Initializing Angular Three...');

	const packageJson = readJson(tree, 'package.json');

	const version =
		packageJson['dependencies']?.['angular-three'] ||
		packageJson['devDependencies']?.['angular-three'] ||
		ANGULAR_THREE_VERSION;

	addDependenciesToPackageJson(
		tree,
		{ 'angular-three': version, three: THREE_VERSION },
		{ '@types/three': THREE_TYPE_VERSION },
	);

	logger.info('Turning on skipLibCheck...');
	const tsConfigPath = tree.exists('tsconfig.base.json') ? 'tsconfig.base.json' : 'tsconfig.json';

	updateJson(tree, tsConfigPath, (json) => {
		if (!('skipLibCheck' in json.compilerOptions) || json.compilerOptions?.skipLibCheck === false) {
			json.compilerOptions.skipLibCheck = true;
		}
		return json;
	});

	// add metadata.json to vscode settings if exists
	const vscodeSettingsPath = '.vscode/settings.json';
	if (tree.exists('.vscode')) {
		logger.info('Enabling typings support for VSCode...');
		if (!tree.exists(vscodeSettingsPath)) {
			writeJson(tree, vscodeSettingsPath, {});
		}
		updateJson(tree, vscodeSettingsPath, (json) => {
			if (json['html.customData'] && Array.isArray(json['html.customData'])) {
				json['html.customData'].push('./node_modules/angular-three/metadata.json');
			} else {
				json['html.customData'] = ['./node_modules/angular-three/metadata.json'];
			}

			return json;
		});
	} else {
		logger.info(
			`.vscode/settings.json not found.
If you are using VSCode, add "./node_modules/angular-three/metadata.json" to "html.customData" in ".vscode/settings.json"
to enable TypeScript type definitions for Angular Three elements.
`,
		);
	}

	return () => {
		installPackagesTask(tree);
	};
}
