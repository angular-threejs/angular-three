import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, NgtArgs, NgtThreeElements, omit, pick } from 'angular-three';
import { GridMaterial, GridMaterialOptions } from 'angular-three-soba/shaders';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Mesh, PlaneGeometry } from 'three';

const defaultOptions: Partial<NgtThreeElements['ngt-mesh']> &
	GridMaterialOptions & { planeArgs: ConstructorParameters<typeof THREE.PlaneGeometry> } = {
	planeArgs: [],
	cellSize: 0.5,
	cellThickness: 0.5,
	cellColor: 'black',
	sectionSize: 1,
	sectionThickness: 1,
	sectionColor: '#2080ff',
	infiniteGrid: false,
	followCamera: false,
	fadeDistance: 100,
	fadeStrength: 1,
	fadeFrom: 1,
	side: THREE.BackSide,
};

@Component({
	selector: 'ngts-grid',
	template: `
		<ngt-mesh #mesh [frustumCulled]="false" [parameters]="parameters()">
			<ngt-plane-geometry *args="planeArgs()" />
			<ngt-grid-material transparent [side]="side()" [parameters]="uniforms()" extensions.derivatives />
			<ng-content />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsGrid {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'planeArgs',
		'cellSize',
		'cellThickness',
		'cellColor',
		'sectionSize',
		'sectionThickness',
		'sectionColor',
		'infiniteGrid',
		'followCamera',
		'fadeDistance',
		'fadeStrength',
		'fadeFrom',
		'side',
	]);

	meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	private plane = new THREE.Plane();
	private upVector = new THREE.Vector3(0, 1, 0);
	private zeroVector = new THREE.Vector3(0, 0, 0);

	protected planeArgs = pick(this.options, 'planeArgs');
	protected side = pick(this.options, 'side');

	private cellSize = pick(this.options, 'cellSize');
	private sectionSize = pick(this.options, 'sectionSize');
	private cellColor = pick(this.options, 'cellColor');
	private sectionColor = pick(this.options, 'sectionColor');
	private cellThickness = pick(this.options, 'cellThickness');
	private sectionThickness = pick(this.options, 'sectionThickness');
	private fadeDistance = pick(this.options, 'fadeDistance');
	private fadeStrength = pick(this.options, 'fadeStrength');
	private fadeFrom = pick(this.options, 'fadeFrom');
	private infiniteGrid = pick(this.options, 'infiniteGrid');
	private followCamera = pick(this.options, 'followCamera');

	protected uniforms = computed(() => {
		const [
			cellSize,
			sectionSize,
			cellColor,
			sectionColor,
			cellThickness,
			sectionThickness,
			fadeDistance,
			fadeStrength,
			fadeFrom,
			infiniteGrid,
			followCamera,
		] = [
			this.cellSize(),
			this.sectionSize(),
			this.cellColor(),
			this.sectionColor(),
			this.cellThickness(),
			this.sectionThickness(),
			this.fadeDistance(),
			this.fadeStrength(),
			this.fadeFrom(),
			this.infiniteGrid(),
			this.followCamera(),
		];

		return {
			cellSize,
			sectionSize,
			cellColor,
			sectionColor,
			cellThickness,
			sectionThickness,
			fadeDistance,
			fadeStrength,
			fadeFrom,
			infiniteGrid,
			followCamera,
		};
	});

	constructor() {
		extend({ Mesh, PlaneGeometry, GridMaterial });

		beforeRender(({ camera }) => {
			const mesh = this.meshRef().nativeElement;

			this.plane.setFromNormalAndCoplanarPoint(this.upVector, this.zeroVector).applyMatrix4(mesh.matrixWorld);

			const gridMaterial = mesh.material as THREE.ShaderMaterial;
			const worldCamProjPosition = gridMaterial.uniforms['worldCamProjPosition'] as THREE.Uniform<THREE.Vector3>;
			const worldPlanePosition = gridMaterial.uniforms['worldPlanePosition'] as THREE.Uniform<THREE.Vector3>;

			this.plane.projectPoint(camera.position, worldCamProjPosition.value);
			worldPlanePosition.value.set(0, 0, 0).applyMatrix4(mesh.matrixWorld);
		});
	}
}
