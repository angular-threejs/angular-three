import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, type Tree } from '@nx/devkit';
import { ANGULAR_THREE_VERSION, NGXTENSION_VERSION, RAPIER_COMPAT_VERSION } from '../versions';

export default async function (tree: Tree) {
	logger.log('Initializing Angular Three Rapier...');

	const packageJson = readJson(tree, 'package.json');

	const version =
		packageJson['dependencies']?.['angular-three'] ||
		packageJson['devDependencies']?.['angular-three'] ||
		ANGULAR_THREE_VERSION;

	addDependenciesToPackageJson(
		tree,
		{
			'angular-three-rapier': version,
			'angular-three-soba': version,
			'@dimforge/rapier3d-compat': RAPIER_COMPAT_VERSION,
			ngxtension: NGXTENSION_VERSION,
		},
		{},
	);

	return () => {
		installPackagesTask(tree);
	};
}
