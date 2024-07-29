import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, NgtArgs, NgtMesh, omit, pick } from 'angular-three';
import { GridMaterial, GridMaterialOptions } from 'angular-three-soba/shaders';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BackSide, Mesh, Plane, PlaneGeometry, ShaderMaterial, Uniform, Vector3 } from 'three';

const defaultOptions: Partial<NgtMesh> &
	GridMaterialOptions & { planeArgs: ConstructorParameters<typeof PlaneGeometry> } = {
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
	side: BackSide,
};

@Component({
	selector: 'ngts-grid',
	standalone: true,
	template: `
		<ngt-mesh #mesh [frustumCulled]="false" [parameters]="parameters()">
			<ngt-plane-geometry *args="planeArgs()" />
			<ngt-grid-material [transparent]="true" [side]="side()" [parameters]="uniforms()">
				<ngt-value attach="extensions.derivatives" [rawValue]="true" />
			</ngt-grid-material>
			<ng-content />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsGrid {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
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

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	private plane = new Plane();
	private upVector = new Vector3(0, 1, 0);
	private zeroVector = new Vector3(0, 0, 0);

	planeArgs = pick(this.options, 'planeArgs');
	side = pick(this.options, 'side');
	uniforms = computed(() => {
		const {
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
		} = this.options();
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

		injectBeforeRender(({ camera }) => {
			const mesh = this.meshRef().nativeElement;

			this.plane.setFromNormalAndCoplanarPoint(this.upVector, this.zeroVector).applyMatrix4(mesh.matrixWorld);

			const gridMaterial = mesh.material as ShaderMaterial;
			const worldCamProjPosition = gridMaterial.uniforms['worldCamProjPosition'] as Uniform<Vector3>;
			const worldPlanePosition = gridMaterial.uniforms['worldPlanePosition'] as Uniform<Vector3>;

			this.plane.projectPoint(camera.position, worldCamProjPosition.value);
			worldPlanePosition.value.set(0, 0, 0).applyMatrix4(mesh.matrixWorld);
		});
	}
}
