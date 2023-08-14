import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, type Tree } from '@nx/devkit';
import { ANGULAR_THREE_VERSION, POSTPROCESSING_VERSION } from '../versions';

export default async function (tree: Tree) {
	logger.log('Initializing Angular Three Postprocessing...');

	const packageJson = readJson(tree, 'package.json');

	const version =
		packageJson['dependencies']?.['angular-three'] ||
		packageJson['devDependencies']?.['angular-three'] ||
		ANGULAR_THREE_VERSION;

	addDependenciesToPackageJson(
		tree,
		{
			'angular-three-postprocessing': version,
			postprocessing: POSTPROCESSING_VERSION,
		},
		{},
	);

	return () => {
		installPackagesTask(tree);
	};
}
