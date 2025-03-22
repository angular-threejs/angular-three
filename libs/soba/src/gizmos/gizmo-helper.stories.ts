import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import {
	NgtsGizmoHelper,
	NgtsGizmoHelperOptions,
	NgtsGizmoViewcube,
	NgtsGizmoViewport,
} from 'angular-three-soba/gizmos';
import { gltfResource } from 'angular-three-soba/loaders';
import { select, storyDecorators, storyObject } from '../setup-canvas';

@Component({
	selector: 'gizmo-helper-tokyo',
	template: `
		<ngt-primitive *args="[gltf.scene()]" [parameters]="{ scale: 0.01 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
class Tokyo {
	protected gltf = gltfResource(() => './LittlestTokyo-transformed.glb');
}

@Component({
	template: `
		<gizmo-helper-tokyo />

		<ngts-gizmo-helper [options]="options()">
			<ngts-gizmo-viewport *gizmoHelperContent />
		</ngts-gizmo-helper>

		<ngts-orbit-controls [options]="{ makeDefault: true }" />
	`,
	imports: [Tokyo, NgtsGizmoHelper, NgtsOrbitControls, NgtsGizmoViewport],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class ViewportStory {
	options = input({} as Partial<NgtsGizmoHelperOptions>);
}

@Component({
	template: `
		<gizmo-helper-tokyo />

		<ngts-gizmo-helper [options]="options()">
			<ngts-gizmo-viewcube *gizmoHelperContent />
		</ngts-gizmo-helper>

		<ngts-orbit-controls [options]="{ makeDefault: true }" />
	`,
	imports: [Tokyo, NgtsGizmoHelper, NgtsGizmoViewcube, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class ViewcubeStory {
	options = input({} as Partial<NgtsGizmoHelperOptions>);
}

export default {
	title: 'Gizmos/GizmoHelper',
	decorators: storyDecorators(),
} as Meta;

const alignments = [
	'top-left',
	'top-right',
	'bottom-right',
	'bottom-left',
	'bottom-center',
	'center-right',
	'center-left',
	'center-center',
	'top-center',
];

export const WithViewcube = storyObject(ViewcubeStory, {
	camera: { position: [0, 0, 10] },
	controls: false,
	argsOptions: {
		options: { alignment: select('bottom-right', { options: alignments }), margin: [80, 80] },
	},
});
export const WithViewport = storyObject(ViewportStory, {
	camera: { position: [0, 0, 10] },
	controls: false,
	argsOptions: {
		options: { alignment: select('bottom-right', { options: alignments }), margin: [80, 80] },
	},
});
