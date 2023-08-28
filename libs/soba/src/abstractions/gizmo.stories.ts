import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsGizmoHelper, NgtsGizmoViewcube, NgtsGizmoViewport } from 'angular-three-soba/gizmos';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { injectNgtsAnimations } from 'angular-three-soba/misc';
import { NgtsSobaContent } from 'angular-three-soba/utils';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

const alignment = [
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
const controls = ['OrbitControls'];
const faces = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'];
const gizmos = ['GizmoViewcube', 'GizmoViewport'];

const args = {
	alignment: alignment[2],
	color: 'white',
	colorX: 'red',
	colorY: 'green',
	colorZ: 'blue',
	controls: controls[0],
	faces,
	gizmo: gizmos[0],
	hideNegativeAxes: false,
	hoverColor: 'lightgray',
	labelColor: 'black',
	marginX: 80,
	marginY: 80,
	opacity: 1,
	strokeColor: 'gray',
	textColor: 'black',
};

@Component({
	standalone: true,
	template: `
		<ngt-primitive *args="[model()]" [scale]="0.01" [ref]="animations.ref" />
		<ngts-gizmo-helper [alignment]="alignment" [margin]="[marginX, marginY]">
			<ng-template ngtsSobaContent>
				<ngts-gizmo-viewcube
					*ngIf="gizmo === 'GizmoViewcube'; else viewport"
					[color]="color"
					[faces]="faces"
					[hoverColor]="hoverColor"
					[strokeColor]="strokeColor"
					[textColor]="textColor"
					[opacity]="opacity"
				/>
				<ng-template #viewport>
					<ngts-gizmo-viewport
						[axisColors]="[colorX, colorY, colorZ]"
						[hideNegativeAxes]="hideNegativeAxes"
						[labelColor]="labelColor"
					/>
				</ng-template>
			</ng-template>
		</ngts-gizmo-helper>
		<ngts-orbit-controls [makeDefault]="true" />
	`,
	imports: [NgtsGizmoHelper, NgtsGizmoViewcube, NgtsGizmoViewport, NgtArgs, NgIf, NgtsOrbitControls, NgtsSobaContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultGizmoHelperStory {
	private gltf = injectNgtsGLTFLoader(() => 'soba/assets/LittlestTokyo.glb');

	model = computed(() => this.gltf()?.scene || null);
	animations = injectNgtsAnimations(() => this.gltf()?.animations || []);

	@Input() alignment = args.alignment;
	@Input() marginX = args.marginX;
	@Input() marginY = args.marginY;
	@Input() gizmo = args.gizmo;

	@Input() color = args.color;
	@Input() faces = args.faces;
	@Input() hoverColor = args.hoverColor;
	@Input() opacity = args.opacity;
	@Input() strokeColor = args.strokeColor;
	@Input() textColor = args.textColor;

	@Input() controls = args.controls;
	@Input() colorX = args.colorX;
	@Input() colorZ = args.colorZ;
	@Input() colorY = args.colorY;
	@Input() labelColor = args.labelColor;
	@Input() hideNegativeAxes = args.hideNegativeAxes;
}

export default {
	title: 'Gizmo/GizmoHelper',
	decorators: makeDecorators(),
};

const colorArgType = { control: { type: 'color' } };
const generalTable = { table: { categry: 'General' } };
const helperTable = { table: { category: 'GizmoHelper' } };
const viewcubeTable = { table: { category: 'GizmoViewcube' } };
const viewportTable = { table: { category: 'GizmoViewport' } };

const argTypes = {
	alignment: { control: { type: 'select' }, options: alignment, ...helperTable },
	color: { ...colorArgType, ...viewcubeTable },
	colorX: { ...colorArgType, ...viewportTable },
	colorY: { ...colorArgType, ...viewportTable },
	colorZ: { ...colorArgType, ...viewportTable },
	controls: {
		control: { type: 'select' },
		name: 'Controls',
		options: controls,
		...generalTable,
	},
	faces: {
		control: { type: 'array' },
		options: faces,
		...viewcubeTable,
	},
	gizmo: {
		control: { type: 'select' },
		name: 'Gizmo',
		options: gizmos,
		...generalTable,
	},
	hideNegativeAxes: { ...viewportTable },
	hoverColor: { ...viewportTable },
	labelColor: { ...viewportTable },
	marginX: { ...helperTable },
	marginY: { ...helperTable },
	opacity: {
		control: { min: 0, max: 1, step: 0.01, type: 'range' },
		...viewcubeTable,
	},
	strokeColor: { ...colorArgType, ...viewcubeTable },
	textColor: { ...colorArgType, ...viewcubeTable },
};

export const Default = makeStoryObject(DefaultGizmoHelperStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] }, useLegacyLights: true },
	args,
	argTypes,
});
