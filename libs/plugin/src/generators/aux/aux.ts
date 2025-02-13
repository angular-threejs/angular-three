import { addDependenciesToPackageJson, formatFiles, installPackagesTask, logger, readJson, Tree } from '@nx/devkit';
import { prompt } from 'enquirer';
import { PEER_DEPENDENCIES } from '../../versions';

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
		choices: ['angular-three-soba', 'angular-three-rapier', 'angular-three-postprocessing', 'angular-three-cannon'],
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
