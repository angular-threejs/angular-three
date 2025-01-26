import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtTestBed } from 'angular-three/testing';
import { BoxHelper } from 'three';
import { NgtsHelper } from './helper';

describe(NgtsHelper.name, () => {
	@Component({
		selector: 'test-scene-graph',
		template: `
			<ngt-mesh>
				<ngt-box-geometry />
				<ngts-helper [type]="BoxHelper" [options]="$any(['royalblue'])" />
			</ngt-mesh>
		`,
		schemas: [CUSTOM_ELEMENTS_SCHEMA],
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [NgtsHelper],
	})
	class SceneGraph {
		protected readonly BoxHelper = BoxHelper;
	}

	it('should render properly', async () => {
		const { scene, fixture, toGraph } = NgtTestBed.create(SceneGraph);
		fixture.detectChanges();

		expect(scene.children.length).toEqual(2);

		console.log('here???', scene.children);

		expect(scene.children[1].type).toEqual('BoxHelper');
		expect(toGraph()).toMatchSnapshot();
	});
});
