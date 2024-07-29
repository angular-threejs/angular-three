import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, NgtArgs, NgtMesh, omit, pick } from 'angular-three';
import { injectFont, NgtsFontInput } from 'angular-three-soba/loaders';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Mesh } from 'three';
import { mergeVertices, TextGeometry, TextGeometryParameters } from 'three-stdlib';

export interface NgtsText3DOptions extends Omit<TextGeometryParameters, 'font'> {
	bevelSegments: number;
	smooth?: number;
}

const defaultOptions: Partial<NgtMesh> & NgtsText3DOptions = {
	letterSpacing: 0,
	lineHeight: 1,
	size: 1,
	height: 0.2,
	bevelThickness: 0.1,
	bevelSize: 0.01,
	bevelEnabled: false,
	bevelOffset: 0,
	bevelSegments: 4,
	curveSegments: 8,
};

@Component({
	selector: 'ngts-text-3d',
	standalone: true,
	template: `
		<ngt-mesh #mesh [parameters]="parameters()">
			<ngt-text-geometry *args="textArgs()" />
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsText3D {
	font = input.required<NgtsFontInput>();
	text = input.required<string>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
		'letterSpacing',
		'lineHeight',
		'size',
		'height',
		'bevelThickness',
		'bevelSize',
		'bevelEnabled',
		'bevelOffset',
		'bevelSegments',
		'curveSegments',
		'smooth',
	]);

	meshRef = viewChild<ElementRef<Mesh>>('mesh');

	loadedFont = injectFont(this.font);
	private smooth = pick(this.options, 'smooth');
	private textOptions = pick(this.options, [
		'letterSpacing',
		'lineHeight',
		'size',
		'height',
		'bevelThickness',
		'bevelSize',
		'bevelEnabled',
		'bevelOffset',
		'bevelSegments',
		'curveSegments',
	]);

	textArgs = computed(() => {
		const [text, font, textOptions] = [this.text(), this.loadedFont(), this.textOptions()];
		if (!font) return null;
		return [text, { font, ...textOptions }];
	});

	constructor() {
		extend({ Mesh, TextGeometry });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const [mesh, smooth, textArgs] = [this.meshRef()?.nativeElement, this.smooth(), this.textArgs()];
				if (!textArgs || !mesh) return;
				if (smooth) {
					mesh.geometry = mergeVertices(mesh.geometry, smooth);
					mesh.geometry.computeVertexNormals();
				}
			});
		});
	}
}
