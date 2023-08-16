import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, updateJson, type Tree } from '@nx/devkit';
import { addMetadataJson } from '../utils';
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

	addMetadataJson(tree, 'angular-three/metadata.json');

	return () => {
		installPackagesTask(tree);
	};
}
