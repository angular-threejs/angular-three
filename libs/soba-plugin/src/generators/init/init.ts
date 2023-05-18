import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, Tree } from '@nx/devkit';

export const ANGULAR_THREE_SOBA_VERSION = '^2.0.0';
export const THREE_STDLIB_VERSION = '^2.0.0';

export default async function (tree: Tree) {
    logger.log('Initializing Angular Three...');

    const packageJson = readJson(tree, 'package.json');

    const version =
        packageJson['dependencies']?.['angular-three-soba'] ||
        packageJson['devDependencies']?.['angular-three-soba'] ||
        ANGULAR_THREE_SOBA_VERSION;

    addDependenciesToPackageJson(
        tree,
        {
            'angular-three-soba': version,
            'three-stdlib': THREE_STDLIB_VERSION,
        },
        {}
    );

    return () => {
        installPackagesTask(tree);
    };
}
