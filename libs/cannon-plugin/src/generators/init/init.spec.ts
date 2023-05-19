import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import init, { ANGULAR_THREE_CANNON_VERSION, CANNON_ES_VERSION, CANNON_WORKER_API_VERSION } from './init';

describe('init generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should add three dependencies', async () => {
        await init(appTree);

        const packageJson = readJson(appTree, 'package.json');

        expect(packageJson.dependencies['angular-three-cannon']).toEqual(ANGULAR_THREE_CANNON_VERSION);
        expect(packageJson.dependencies['@pmndrs/cannon-worker-api']).toEqual(CANNON_WORKER_API_VERSION);
        expect(packageJson.dependencies['cannon-es']).toEqual(CANNON_ES_VERSION);
    });
});
