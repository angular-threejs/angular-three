import { addDependenciesToPackageJson, formatFiles, installPackagesTask, logger, readJson, Tree } from '@nx/devkit';
import { prompt } from 'enquirer';
import { addMetadataJson } from '../utils';
import { SOBA_PEER_DEPENDENCIES } from '../version';

const ENTRY_POINTS = {
	abstractions: ['troika-three-text'],
	controls: ['camera-controls', 'maath'],
	materials: ['three-custom-shader-material'],
	staging: ['troika-three-text', '@monogrid/gainmap-js'],
	stats: ['stats-gl'],
};

export async function addSobaGenerator(tree: Tree) {
	const packagesToAdd = ['three-stdlib', '@pmndrs/vanilla', 'three-mesh-bvh'];

	const packageJson = readJson(tree, 'package.json');
	const ngtVersion = packageJson['dependencies']['angular-three'] || packageJson['devDependencies']['angular-three'];

	if (!ngtVersion) {
		logger.error('angular-three is not installed.');
		return;
	}

	logger.info('Adding angular-three-soba...');
	addMetadataJson(tree, 'angular-three-soba/metadata.json');

	const { peerDependencies } = await prompt<{ peerDependencies: string[] }>({
		type: 'multiselect',
		name: 'peerDependencies',
		message: `To know which peer dependencies we need to add, please select the secondary entry points you are planning to use:`,
		choices: [
			...Object.entries(ENTRY_POINTS).map(([entryPoint, deps]) => ({
				value: deps,
				name: `angular-three-soba/${entryPoint}`,
				message: entryPoint,
			})),
			{
				value: [
					'troika-three-text',
					'three-custom-shader-material',
					'@monogrid/gainmap-js',
					'camera-controls',
					'maath',
					'stats-gl',
				],
				name: 'All',
				message: 'I am not sure. Let me add all the peer dependencies.',
			},
		],
		// @ts-expect-error - result is typed for single select but we're using multi select
		result(values) {
			const mapped = this.map(values);
			return (values as unknown as string[]).flatMap((value) => mapped[value]);
		},
	});

	// flatten, dedupe peerDependencies, add to packagesToAdd
	peerDependencies
		.filter((item, index, array) => array.indexOf(item) === index)
		.forEach((item) => {
			if (!packagesToAdd.includes(item)) {
				packagesToAdd.push(item);
			}
		});

	const depsToAdd = packagesToAdd.reduce(
		(acc, item) => {
			if (SOBA_PEER_DEPENDENCIES[item]) {
				acc[item] = SOBA_PEER_DEPENDENCIES[item];
			}
			return acc;
		},
		{ 'angular-three-soba': ngtVersion } as Record<string, string>,
	);

	// add deps to package.json
	logger.info('Adding dependencies to package.json...');
	addDependenciesToPackageJson(tree, depsToAdd, {});

	await formatFiles(tree);

	return () => {
		installPackagesTask(tree);
	};
}

export default addSobaGenerator;
