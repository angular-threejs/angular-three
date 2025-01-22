import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { applyProps, extend, NgtArgs, NgtThreeElements, NgtVector3, omit, pick, vector3 } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Mesh, MeshBasicMaterial, PlaneGeometry, RingGeometry } from 'three';

export interface NgtsLightformerOptions {
	map?: THREE.Texture;
	toneMapped: boolean;
	color: string;
	form: 'circle' | 'ring' | 'rect';
	scale: number | [number, number, number] | [number, number];
	intensity: number;
	target?: NgtVector3;
}

const defaultOptions: Partial<Omit<NgtThreeElements['ngt-mesh'], 'scale'>> & NgtsLightformerOptions = {
	toneMapped: false,
	color: 'white',
	form: 'rect',
	scale: 1,
	intensity: 1,
};

@Component({
	selector: 'ngts-lightformer',
	template: `
		<ngt-mesh #mesh [scale]="fixedScale()" [parameters]="parameters()">
			<ng-content select="[data-lightformer-geometry]">
				@switch (form()) {
					@case ('circle') {
						<ngt-ring-geometry *args="[0, 1, 64]" />
					}
					@case ('ring') {
						<ngt-ring-geometry *args="[0.5, 1, 64]" />
					}
					@case ('rect') {
						<ngt-plane-geometry />
					}
				}
			</ng-content>
			<ng-content select="[data-lightformer-material]">
				<ngt-mesh-basic-material #defaultMaterial [toneMapped]="toneMapped()" [map]="map()" [side]="side" />
			</ng-content>

			<ng-content />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsLightformer {
	protected readonly side = THREE.DoubleSide;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['map', 'toneMapped', 'color', 'form', 'scale', 'intensity', 'target']);

	private intensity = pick(this.options, 'intensity');
	private color = pick(this.options, 'color');
	private target = vector3(this.options, 'target', true);
	private scale = pick(this.options, 'scale');
	protected fixedScale = computed(() => {
		const scale = this.scale();
		return Array.isArray(scale) && scale.length === 2 ? [scale[0], scale[1], 1] : scale;
	});
	protected form = pick(this.options, 'form');
	protected toneMapped = pick(this.options, 'toneMapped');
	protected map = pick(this.options, 'map');

	meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');
	private defaultMaterialRef = viewChild<ElementRef<THREE.MeshBasicMaterial>>('defaultMaterial');

	constructor() {
		extend({ Mesh, MeshBasicMaterial, RingGeometry, PlaneGeometry });

		effect(() => {
			const material = this.defaultMaterialRef()?.nativeElement;
			if (!material) return;

			applyProps(material, { color: this.color() });
			material.color.multiplyScalar(this.intensity());
		});

		effect(() => {
			const target = this.target();
			if (!target) return;

			const mesh = this.meshRef().nativeElement;
			mesh.lookAt(target);
		});
	}
}
