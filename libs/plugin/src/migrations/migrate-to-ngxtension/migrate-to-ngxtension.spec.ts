import { UnitTestRunner, libraryGenerator } from '@nx/angular/generators';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import update from './migrate-to-ngxtension';

import type { Schema } from '@nx/angular/src/generators/library/schema';

describe('migrate-to-ngxtension migration', () => {
	let tree: Tree;

	async function setup(api: string) {
		tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
		await libraryGenerator(tree, {
			name: 'lib-one',
			flat: true,
			spec: false,
			linter: 'none' as Schema['linter'],
			routing: false,
			skipTests: true,
			skipModule: true,
			skipSelector: true,
			standalone: true,
			inlineStyle: true,
			inlineTemplate: true,
			unitTestRunner: UnitTestRunner.None,
		});

		const content = tree.read('libs/lib-one/src/lib/lib-one.component.ts', 'utf8');
		tree.write(
			'libs/lib-one/src/lib/lib-one.component.ts',
			`
import { ${api} } from 'angular-three';
${content}`,
		);
	}

	[
		['createInjectionToken', 'create-injection-token'],
		['assertInjector', 'assert-injector'],
		['NgtRepeat', 'repeat', 'Repeat'],
	].forEach(([api, entry, alias]) => {
		it(`should migrate ${api} successfully`, async () => {
			await setup(api);
			await update(tree);

			const content = tree.read('libs/lib-one/src/lib/lib-one.component.ts', 'utf8');
			const finalImport = alias ? `${alias} as ${api}` : api;

			expect(content).not.toContain(`import { ${api} } from 'angular-three';`);
			expect(content).toContain(`import { ${finalImport} } from 'ngxtension/${entry}';`);
		});
	});
});
