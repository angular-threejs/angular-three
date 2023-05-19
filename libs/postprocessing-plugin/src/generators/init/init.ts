import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, Tree } from '@nx/devkit';

export const ANGULAR_THREE_POSTPROCESSING_VERSION = '^2.0.0';
export const POSTPROCESSING_VERSION = '^6.0.0';

export default async function (tree: Tree) {
    logger.log('Initializing Angular Three Cannon...');

    const packageJson = readJson(tree, 'package.json');

    const version =
        packageJson['dependencies']?.['angular-three-postprocessing'] ||
        packageJson['devDependencies']?.['angular-three-postprocessing'] ||
        ANGULAR_THREE_POSTPROCESSING_VERSION;

    addDependenciesToPackageJson(
        tree,
        {
            'angular-three-postprocessing': version,
            postprocessing: POSTPROCESSING_VERSION,
        },
        {}
    );

    return () => {
        installPackagesTask(tree);
    };
}
