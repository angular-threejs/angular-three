import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, signal, type Signal } from '@angular/core';
import { NgtArgs, type NgtAnyRecord, type NgtThreeEvent } from 'angular-three-old';
import { NgtsOrbitControls } from 'angular-three-soba-old/controls';
import { injectNgtsGLTFLoader, type NgtsGLTF } from 'angular-three-soba-old/loaders';
import { NgtsBounds, NgtsContactShadows, injectNgtsBoundsApi } from 'angular-three-soba-old/staging';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

injectNgtsGLTFLoader.preload(() => 'soba/bounds-assets.glb');

type BoundsGLTF = NgtsGLTF<{ nodes: Record<string, THREE.Mesh> }>;

@Component({
	selector: 'bounds-model',
	standalone: true,
	template: `
		<ngt-mesh *ngIf="model() as model" ngtCompound [material]="model.material" [geometry]="model.geometry">
			<ngt-value [rawValue]="'red'" attach="material.emissive" />
			<ngt-value [rawValue]="1" attach="material.roughness" />
		</ngt-mesh>
	`,
	imports: [NgtArgs, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Model {
	private models = injectNgtsGLTFLoader(() => 'soba/bounds-assets.glb') as Signal<BoundsGLTF>;
	model = computed(() => {
		const [name, models] = [this._name(), this.models()];
		if (!name || !models) return null;
		return models.nodes[name];
	});

	readonly _name = signal('');
	@Input({ required: true }) set name(name: string) {
		this._name.set(name);
	}
}

@Component({
	selector: 'bounds-models',
	standalone: true,
	template: `
		<ngt-group (click)="onClick($event)" (pointermissed)="onPointerMissed($event)">
			<bounds-model name="Curly" [position]="[1, -11, -20]" [rotation]="[2, 0, -0]" />
			<bounds-model name="DNA" [position]="[20, 0, -17]" [rotation]="[1, 1, -2]" />
			<bounds-model name="Headphones" [position]="[20, 2, 4]" [rotation]="[1, 0, -1]" />
			<bounds-model name="Notebook" [position]="[-21, -15, -13]" [rotation]="[2, 0, 1]" />
			<bounds-model name="Rocket003" [position]="[18, 15, -25]" [rotation]="[1, 1, 0]" />
			<bounds-model name="Roundcube001" [position]="[-25, -4, 5]" [rotation]="[1, 0, 0]" [scale]="0.5" />
			<bounds-model name="Table" [position]="[1, -4, -28]" [rotation]="[1, 0, -1]" [scale]="0.5" />
			<bounds-model name="VR_Headset" [position]="[7, -15, 28]" [rotation]="[1, 0, -1]" [scale]="5" />
			<bounds-model name="Zeppelin" [position]="[-20, 10, 10]" [rotation]="[3, -1, 3]" [scale]="0.005" />
		</ngt-group>
	`,
	imports: [Model],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Models {
	private boundsApi = injectNgtsBoundsApi();

	onClick(event: NgtThreeEvent<MouseEvent>) {
		event.stopPropagation();
		event.delta <= 2 && this.boundsApi().refresh(event.object).fit();
	}

	onPointerMissed(event: NgtThreeEvent<PointerEvent>) {
		(event as NgtAnyRecord)['button'] === 0 && this.boundsApi().refresh().fit();
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['pink']" attach="background" />

		<ngt-spot-light [position]="-100" [intensity]="0.2 * Math.PI" [angle]="0.3" [penumbra]="1" />
		<ngt-hemisphere-light color="white" groundColor="#ff0f00" [position]="[-7, 25, 13]" [intensity]="Math.PI" />

		<ngts-bounds>
			<bounds-models />
		</ngts-bounds>

		<ngts-contact-shadows [position]="[0, -35, 0]" [opacity]="1" [width]="200" [height]="200" [blur]="1" [far]="50" />

		<ngts-orbit-controls [makeDefault]="true" [minPolarAngle]="0" [maxPolarAngle]="Math.PI * 1.75" />
	`,
	imports: [NgtsBounds, NgtArgs, NgtsOrbitControls, NgtsContactShadows, Models],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultBoundsStory {
	Math = Math;
}

export default {
	title: 'Staging/Bounds',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultBoundsStory, {
	canvasOptions: {
		camera: { fov: 50, position: [0, -10, 100] },
		controls: false,
		lights: false,
		compoundPrefixes: ['bounds-model'],
	},
});
