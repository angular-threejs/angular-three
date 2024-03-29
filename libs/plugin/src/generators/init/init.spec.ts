import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import init, { ANGULAR_THREE_VERSION, THREE_TYPE_VERSION, THREE_VERSION } from './init';

describe('init generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should add three dependencies', async () => {
        await init(appTree);

        const packageJson = readJson(appTree, 'package.json');

        expect(packageJson.dependencies['angular-three']).toEqual(ANGULAR_THREE_VERSION);
        expect(packageJson.dependencies['three']).toEqual(THREE_VERSION);
        expect(packageJson.devDependencies['@types/three']).toEqual(THREE_TYPE_VERSION);
    });

    it('should update skipLibCheck in tsconfig.base.json', async () => {
        await init(appTree);

        const tsConfig = readJson(appTree, 'tsconfig.base.json');
        expect(tsConfig.compilerOptions.skipLibCheck).toEqual(true);
    });

    it('should update skipLibCheck in tsconfig.json', async () => {
        appTree.rename('tsconfig.base.json', 'tsconfig.json');
        await init(appTree);

        const tsConfig = readJson(appTree, 'tsconfig.json');
        expect(tsConfig.compilerOptions.skipLibCheck).toEqual(true);
    });
});
