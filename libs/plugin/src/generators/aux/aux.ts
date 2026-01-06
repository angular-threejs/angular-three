import { addDependenciesToPackageJson, formatFiles, installPackagesTask, logger, readJson, Tree } from '@nx/devkit';
import { prompt } from 'enquirer';
import { addMetadataJson } from '../../utils';
import { PEER_DEPENDENCIES } from '../../versions';

/**
 * Adds auxiliary Angular Three packages to an existing Angular Three project.
 *
 * This generator allows you to add optional packages like:
 * - angular-three-soba: Utilities and abstractions for 3D scenes
 * - angular-three-rapier: Rapier physics engine integration
 * - angular-three-postprocessing: Post-processing effects
 * - angular-three-cannon: Cannon.js physics engine integration
 * - angular-three-tweakpane: Tweakpane UI controls
 * - angular-three-theatre: Theatre.js animation toolkit
 *
 * Each package is installed with its required peer dependencies.
 *
 * @param tree - The Nx virtual file system tree
 * @returns A function that triggers package installation, or void if no packages selected
 *
 * @example
 * ```bash
 * nx g angular-three-plugin:aux
 * ```
 */
export async function auxGenerator(tree: Tree) {
	logger.info('[NGT] Initialize auxiliary packages');

	const packageJson = readJson(tree, 'package.json');
	if (!packageJson) {
		logger.warn(`[NGT] PackageJson not found in: ${tree.root}`);
		return;
	}

	const ngtVersion =
		packageJson['dependencies']?.['angular-three'] || packageJson['devDependencies']?.['angular-three'];

	if (!ngtVersion) {
		logger.warn(`[NGT] angular-three is not installed.`);
		return;
	}

	const { packages } = await prompt<{ packages: string[] }>({
		type: 'multiselect',
		name: 'packages',
		message: 'Which packages to add?',
		choices: [
			'angular-three-soba',
			'angular-three-rapier',
			'angular-three-postprocessing',
			'angular-three-cannon',
			'angular-three-tweakpane',
			'angular-three-theatre',
		],
	});

	const packagesToAdd = {};

	for (const pkg of packages) {
		const exist = packageJson['dependencies']?.[pkg] || packageJson['devDependencies']?.[pkg];
		if (exist) {
			logger.warn(`[NGT] ${pkg} is already installed. Skipping`);
			continue;
		}

		packagesToAdd[pkg] = ngtVersion;

		if (PEER_DEPENDENCIES[pkg]) {
			for (const depName in PEER_DEPENDENCIES[pkg]) {
				packagesToAdd[depName] = PEER_DEPENDENCIES[pkg][depName];
			}
		}

		if (pkg === 'angular-three-soba') {
			addMetadataJson(tree, 'angular-three-soba/metadata.json');
		}
	}

	if (Object.keys(packagesToAdd).length === 0) {
		console.warn(`[NGT] No packages to add`);
		return;
	}

	addDependenciesToPackageJson(tree, packagesToAdd, {});

	await formatFiles(tree);

	return () => {
		installPackagesTask(tree);
	};
}

export default auxGenerator;
