import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, type Tree } from '@nx/devkit';
import {
	ANGULAR_THREE_VERSION,
	CANNON_ES_DEBUGGER_VERSION,
	CANNON_ES_VERSION,
	CANNON_WORKER_API_VERSION,
	NGXTENSION_VERSION,
} from '../versions';

export default async function (tree: Tree) {
	logger.log('Initializing Angular Three Cannon...');

	const packageJson = readJson(tree, 'package.json');

	const version =
		packageJson['dependencies']?.['angular-three'] ||
		packageJson['devDependencies']?.['angular-three'] ||
		ANGULAR_THREE_VERSION;

	addDependenciesToPackageJson(
		tree,
		{
			'angular-three-cannon': version,
			'@pmndrs/cannon-worker-api': CANNON_WORKER_API_VERSION,
			'cannon-es': CANNON_ES_VERSION,
			'cannon-es-debugger': CANNON_ES_DEBUGGER_VERSION,
			ngxtension: NGXTENSION_VERSION,
		},
		{},
	);

	return () => {
		installPackagesTask(tree);
	};
}
