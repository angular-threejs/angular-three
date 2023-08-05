import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtArgs, extend, injectBeforeRender, injectNgtRef, signalStore, type NgtMesh } from 'angular-three';
import { GridMaterial, type NgtGridMaterialState } from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { Mesh, PlaneGeometry } from 'three';

extend({ GridMaterial, Mesh, PlaneGeometry });

export type NgtsGridState = {
	/** Default plane-geometry arguments */
	args?: ConstructorParameters<typeof THREE.PlaneGeometry>;
} & NgtGridMaterialState;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh
		 */
		'ngts-grid': NgtsGridState & NgtMesh;
	}
}

@Component({
	selector: 'ngts-grid',
	standalone: true,
	template: `
		<ngt-mesh ngtCompound [ref]="gridRef" [frustumCulled]="false">
			<ngt-plane-geometry *args="args()" />
			<ngt-grid-material
				[transparent]="true"
				[side]="side()"
				[cellSize]="cellSize()"
				[cellColor]="cellColor()"
				[cellThickness]="cellThickness()"
				[sectionSize]="sectionSize()"
				[sectionColor]="sectionColor()"
				[sectionThickness]="sectionThickness()"
				[fadeDistance]="fadeDistance()"
				[fadeStrength]="fadeStrength()"
				[infiniteGrid]="infiniteGrid()"
				[followCamera]="followCamera()"
			>
				<ngt-value attach="extensions.derivatives" [rawValue]="false" />
			</ngt-grid-material>
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGrid {
	private inputs = signalStore<NgtsGridState>({
		cellColor: '#000000',
		sectionColor: '#2080ff',
		cellSize: 0.5,
		sectionSize: 1,
		followCamera: false,
		infiniteGrid: false,
		fadeDistance: 100,
		fadeStrength: 1,
		cellThickness: 0.5,
		sectionThickness: 1,
		side: THREE.BackSide,
		args: [1, 1, 1, 1],
	});

	@Input() gridRef = injectNgtRef<THREE.Mesh>();
	@Input({ alias: 'cellSize' }) set _cellSize(cellSize: NgtsGridState['cellSize']) {
		this.inputs.set({ cellSize });
	}

	@Input({ alias: 'cellThickness' }) set _cellThickness(cellThickness: NgtsGridState['cellThickness']) {
		this.inputs.set({ cellThickness });
	}

	@Input({ alias: 'cellColor' }) set _cellColor(cellColor: NgtsGridState['cellColor']) {
		this.inputs.set({ cellColor });
	}

	@Input({ alias: 'sectionSize' }) set _sectionSize(sectionSize: NgtsGridState['sectionSize']) {
		this.inputs.set({ sectionSize });
	}

	@Input({ alias: 'sectionThickness' }) set _sectionThickness(sectionThickness: NgtsGridState['sectionThickness']) {
		this.inputs.set({ sectionThickness });
	}

	@Input({ alias: 'sectionColor' }) set _sectionColor(sectionColor: NgtsGridState['sectionColor']) {
		this.inputs.set({ sectionColor });
	}

	@Input({ alias: 'followCamera' }) set _followCamera(followCamera: NgtsGridState['followCamera']) {
		this.inputs.set({ followCamera });
	}

	@Input({ alias: 'infiniteGrid' }) set _infiniteGrid(infiniteGrid: NgtsGridState['infiniteGrid']) {
		this.inputs.set({ infiniteGrid });
	}

	@Input({ alias: 'fadeDistance' }) set _fadeDistance(fadeDistance: NgtsGridState['fadeDistance']) {
		this.inputs.set({ fadeDistance });
	}

	@Input({ alias: 'fadeStrength' }) set _fadeStrength(fadeStrength: NgtsGridState['fadeStrength']) {
		this.inputs.set({ fadeStrength });
	}

	@Input({ alias: 'side' }) set _side(side: NgtsGridState['side']) {
		this.inputs.set({ side });
	}

	@Input({ alias: 'args' }) set _args(args: NgtsGridState['args']) {
		this.inputs.set({ args });
	}

	cellSize = this.inputs.select('cellSize');
	sectionSize = this.inputs.select('sectionSize');
	fadeDistance = this.inputs.select('fadeDistance');
	fadeStrength = this.inputs.select('fadeStrength');
	cellThickness = this.inputs.select('cellThickness');
	sectionThickness = this.inputs.select('sectionThickness');
	infiniteGrid = this.inputs.select('infiniteGrid');
	followCamera = this.inputs.select('followCamera');
	cellColor = this.inputs.select('cellColor');
	sectionColor = this.inputs.select('sectionColor');
	side = this.inputs.select('side');
	args = this.inputs.select('args');

	private plane = new THREE.Plane();
	private upVector = new THREE.Vector3(0, 1, 0);
	private zeroVector = new THREE.Vector3(0, 0, 0);

	constructor() {
		injectBeforeRender(({ camera }) => {
			this.plane
				.setFromNormalAndCoplanarPoint(this.upVector, this.zeroVector)
				.applyMatrix4(this.gridRef.nativeElement.matrixWorld);

			const gridMaterial = this.gridRef.nativeElement.material as THREE.ShaderMaterial;
			const worldCamProjPosition = gridMaterial.uniforms['worldCamProjPosition'] as THREE.Uniform<THREE.Vector3>;
			const worldPlanePosition = gridMaterial.uniforms['worldPlanePosition'] as THREE.Uniform<THREE.Vector3>;

			this.plane.projectPoint(camera.position, worldCamProjPosition.value);
			worldPlanePosition.value.set(0, 0, 0).applyMatrix4(this.gridRef.nativeElement.matrixWorld);
		});
	}
}
