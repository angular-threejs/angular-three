import { addDependenciesToPackageJson, installPackagesTask, logger, readJson, Tree, updateJson } from '@nx/devkit';

export const ANGULAR_THREE_VERSION = '^1.0.0';
export const THREE_VERSION = '^0.149.0';
export const THREE_TYPE_VERSION = '^0.149.0';

export default async function (tree: Tree) {
    logger.log('Initializing Angular Three...');

    const packageJson = readJson(tree, 'package.json');

    const version =
        packageJson['dependencies']?.['angular-three'] ||
        packageJson['devDependencies']?.['angular-three'] ||
        ANGULAR_THREE_VERSION;

    addDependenciesToPackageJson(
        tree,
        {
            'angular-three': version,
            three: THREE_VERSION,
        },
        {
            '@types/three': THREE_TYPE_VERSION,
        }
    );

    logger.info('Turning on skipLibCheck...');
    const tsConfigPath = tree.exists('tsconfig.base.json') ? 'tsconfig.base.json' : 'tsconfig.json';

    updateJson(tree, tsConfigPath, (json) => {
        if (!('skipLibCheck' in json.compilerOptions) || json.compilerOptions?.skipLibCheck === false) {
            json.compilerOptions.skipLibCheck = true;
        }
        return json;
    });
    return () => {
        installPackagesTask(tree);
    };
}
