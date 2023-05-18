import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import init, { ANGULAR_THREE_SOBA_VERSION, THREE_STDLIB_VERSION } from './init';

describe('init generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should add three dependencies', async () => {
        await init(appTree);

        const packageJson = readJson(appTree, 'package.json');

        expect(packageJson.dependencies['angular-three-soba']).toEqual(ANGULAR_THREE_SOBA_VERSION);
        expect(packageJson.dependencies['three-stdlib']).toEqual(THREE_STDLIB_VERSION);
    });
});
