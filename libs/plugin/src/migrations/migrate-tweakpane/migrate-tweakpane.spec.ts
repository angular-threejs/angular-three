import { libraryGenerator, UnitTestRunner } from '@nx/angular/generators';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import update from './migrate-tweakpane';

describe('migrate-tweakpane migration', () => {
	let tree: Tree;

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
	});

	it('should run successfully', async () => {
		await libraryGenerator(tree, {
			inlineTemplate: true,
			inlineStyle: true,
			skipTests: true,
			unitTestRunner: UnitTestRunner.None,
			directory: `libs/my-lib`,
			buildable: false,
			skipFormat: true,
			standalone: true,
		});

		// mock file content
		tree.write(
			'libs/my-lib/src/index.ts',
			`
import { NgtTweakPane, NgtTweakFolder, NgtTweakText } from 'angular-three-tweakpane';

const template = \`
    <ngt-tweak-pane>
        <ngt-tweak-folder>
            <ngt-tweak-text></ngt-tweak-text>
        </ngt-tweak-folder>
    </ngt-tweak-pane>
\`

const imports = [NgtTweakPane, NgtTweakFolder, NgtTweakText];
`,
		);

		await update(tree);

		const updatedContent = tree.read('libs/my-lib/src/index.ts', 'utf-8');
		expect(updatedContent).toMatchInlineSnapshot(`
			"import {
			  TweakpanePane,
			  TweakpaneFolder,
			  TweakpaneText,
			} from 'angular-three-tweakpane';

			const template = \`
			    <tweakpane-pane>
			        <tweakpane-folder>
			            <tweakpane-text></tweakpane-text>
			        </tweakpane-folder>
			    </tweakpane-pane>
			\`;

			const imports = [TweakpanePane, TweakpaneFolder, TweakpaneText];
			"
		`);
	});
});
