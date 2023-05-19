import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import init, { ANGULAR_THREE_POSTPROCESSING_VERSION, POSTPROCESSING_VERSION } from './init';

describe('init generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should add three dependencies', async () => {
        await init(appTree);

        const packageJson = readJson(appTree, 'package.json');

        expect(packageJson.dependencies['angular-three-postprocessing']).toEqual(ANGULAR_THREE_POSTPROCESSING_VERSION);
        expect(packageJson.dependencies['postprocessing']).toEqual(POSTPROCESSING_VERSION);
    });
});
