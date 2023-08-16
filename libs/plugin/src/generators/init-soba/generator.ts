import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, type Tree } from '@nx/devkit';
import { addMetadataJson } from '../utils';
import {
	ANGULAR_THREE_VERSION,
	MESH_LINE_VERSION,
	STATS_GL_VERSION,
	THREE_MESH_BVH_VERSION,
	THREE_STDLIB_VERSION,
	TROIKA_THREE_TEXT_VERSION,
} from '../versions';

export default async function (tree: Tree) {
	logger.log('Initializing Angular Three Soba...');

	const packageJson = readJson(tree, 'package.json');

	const version =
		packageJson['dependencies']?.['angular-three'] ||
		packageJson['devDependencies']?.['angular-three'] ||
		ANGULAR_THREE_VERSION;

	addDependenciesToPackageJson(
		tree,
		{
			'angular-three-soba': version,
			meshline: MESH_LINE_VERSION,
			'three-stdlib': THREE_STDLIB_VERSION,
			'stats-gl': STATS_GL_VERSION,
			'three-mesh-bvh': THREE_MESH_BVH_VERSION,
			'troika-three-text': TROIKA_THREE_TEXT_VERSION,
		},
		{},
	);

	addMetadataJson(tree, 'angular-three-soba/metadata.json');

	return () => {
		installPackagesTask(tree);
	};
}
