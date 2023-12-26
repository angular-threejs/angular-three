import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewChild, computed, effect } from '@angular/core';
import { NgtArgs, extend, injectBeforeRender, injectNgtLoader, injectNgtRef } from 'angular-three-old';
import { NgtsCurveModifier } from 'angular-three-soba-old/modifiers';
import * as THREE from 'three';
import { FontLoader, TextGeometry } from 'three-stdlib';
import { makeCanvasOptions, makeDecorators, makeStoryFunction } from '../setup-canvas';

extend({ TextGeometry });

@Component({
	standalone: true,
	template: `
		<ngts-curve-modifier #curveModifier [curve]="curve">
			<ngt-mesh>
				<ngt-text-geometry *args="args()" [ref]="geometryRef" />
				<ngt-mesh-normal-material />
			</ngt-mesh>
		</ngts-curve-modifier>
		<ngt-primitive *args="[line]" />
	`,
	imports: [NgtsCurveModifier, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultCurveModifierStory {
	private font = injectNgtLoader(
		() => FontLoader,
		() => 'soba/fonts/helvetiker_regular.typeface.json',
	);
	args = computed(() => {
		const font = this.font();
		if (!font) return [];
		return [
			'hello angular-three-soba',
			{
				font,
				size: 2,
				height: 0.05,
				curveSegments: 12,
				bevelEnabled: true,
				bevelThickness: 0.02,
				bevelSize: 0.01,
				bevelOffset: 0,
				bevelSegments: 5,
			},
		];
	});
	private handlePosition = [
		[10, 0, -10],
		[10, 0, 10],
		[-10, 0, 10],
		[-10, 0, -10],
	].map((hand) => new THREE.Vector3(...hand));

	curve = new THREE.CatmullRomCurve3(this.handlePosition, true, 'centripetal');
	line = new THREE.LineLoop(
		new THREE.BufferGeometry().setFromPoints(this.curve.getPoints(50)),
		new THREE.LineBasicMaterial({ color: 0x00ff00 }),
	);

	geometryRef = injectNgtRef<TextGeometry>();
	@ViewChild('curveModifier', { static: true }) curveModifier!: NgtsCurveModifier;

	constructor() {
		effect(() => {
			const geom = this.geometryRef.nativeElement;
			if (!geom) return;
			geom.rotateX(Math.PI);
		});

		injectBeforeRender(() => {
			this.curveModifier?.moveAlongCurve(0.001);
		});
	}
}

export default {
	title: 'Modifiers/CurveModifier',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({
	camera: { position: [0, 10, 20] },
	useLegacyLights: true,
});

export const Default = makeStoryFunction(DefaultCurveModifierStory, canvasOptions);
