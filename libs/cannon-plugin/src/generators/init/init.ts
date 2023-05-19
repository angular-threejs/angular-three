import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, Tree } from '@nx/devkit';

export const ANGULAR_THREE_CANNON_VERSION = '^2.0.0';
export const CANNON_WORKER_API_VERSION = '^2.3.0';
export const CANNON_ES_VERSION = '^0.20.0';

export default async function (tree: Tree) {
    logger.log('Initializing Angular Three Cannon...');

    const packageJson = readJson(tree, 'package.json');

    const version =
        packageJson['dependencies']?.['angular-three-cannon'] ||
        packageJson['devDependencies']?.['angular-three-cannon'] ||
        ANGULAR_THREE_CANNON_VERSION;

    addDependenciesToPackageJson(
        tree,
        {
            'angular-three-cannon': version,
            '@pmndrs/cannon-worker-api': CANNON_WORKER_API_VERSION,
            'cannon-es': CANNON_ES_VERSION,
        },
        {}
    );

    return () => {
        installPackagesTask(tree);
    };
}
