import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { injectStore, NgtArgs } from 'angular-three';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import { gltfResource } from 'angular-three-soba/loaders';
import CameraControls from 'camera-controls';
import { DoubleSide, FrontSide, Mesh, MeshStandardMaterial } from 'three';
import { GLTF } from 'three-stdlib';
import { menus } from './constants';
import { Cursor } from './cursor';
import { RockStore } from './store';

interface RockGLTF extends GLTF {
	nodes: { defaultMaterial: Mesh };
	materials: { '08___Default': MeshStandardMaterial };
}

@Component({
	template: `
		<ngt-fog *args="['white', 15, 50]" attach="fog" />

		<ngt-grid-helper *args="[50, 10]" />

		<ngt-mesh receiveShadow [rotation.x]="Math.PI / 2">
			<ngt-plane-geometry *args="[100, 100]" />
			<ngt-mesh-phong-material color="white" [side]="DoubleSide" [depthWrite]="false" />
		</ngt-mesh>

		<ngt-hemisphere-light [position]="10" [intensity]="Math.PI * 0.2" />

		<ngt-point-light [position]="10" [decay]="0" castShadow>
			<ngt-vector2 *args="[1024, 1024]" attach="shadow.mapSize" />
			<ngt-value [rawValue]="4" attach="shadow.radius" />
			<ngt-value [rawValue]="-0.0005" attach="shadow.bias" />
		</ngt-point-light>

		@if (gltf.value(); as gltf) {
			<ngt-group [position.y]="2.6" [scale]="3">
				<ngt-group [rotation.x]="-Math.PI / 2">
					<ngt-group [rotation.x]="Math.PI / 2">
						<ngt-mesh
							cursor
							castShadow
							receiveShadow
							[geometry]="gltf.nodes.defaultMaterial.geometry"
							[material]="gltf.materials['08___Default']"
							(click)="router.navigate(['/routed-rocks/rocks'])"
						/>
					</ngt-group>
				</ngt-group>
			</ngt-group>
		}

		<ngts-camera-controls
			[options]="{
				makeDefault: true,
				minDistance: 12,
				maxDistance: 12,
				minPolarAngle: 0,
				maxPolarAngle: Math.PI / 2,
			}"
		/>

		<!-- NOTE: we can also just create the geometry in typescript class -->
		<!-- but we're cool and use the template instead. -->
		<ngt-icosahedron-geometry #geometry attach="none" />
		@for (menu of menus; track menu.id) {
			<ngt-group [name]="menu.name" [position]="[15 * Math.cos(menu.angle), 0, 15 * Math.sin(menu.angle)]">
				<ngt-mesh
					cursor
					castShadow
					receiveShadow
					[position.y]="5"
					[geometry]="geometry"
					(click)="router.navigate([menu.path])"
				>
					<ngt-mesh-phong-material [color]="menu.color" [side]="FrontSide" />


				</ngt-mesh>

                <!-- NOTE: we can use ng-template for this use-case as well. -->
                <!-- @let templateRefs = coloredRockTemplateRefs(); -->
                <!-- @let template = templateRefs[menu.slug]; -->
                <!---->
                <!-- @if (template) { -->
                <!-- 	<ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: menu }" /> -->
                <!-- } -->
			</ngt-group>
		}

		<router-outlet />
	`,
	imports: [RouterOutlet, NgtArgs, NgtsCameraControls, Cursor],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'rocks' },
})
export default class Rocks {
	protected readonly Math = Math;
	protected readonly FrontSide = FrontSide;
	protected readonly DoubleSide = DoubleSide;

	protected readonly menus = menus;

	protected router = inject(Router);
	private rockStore = inject(RockStore);
	private store = injectStore();

	protected gltf = gltfResource<RockGLTF>(() => './rock2/scene.gltf');

	constructor() {
		effect(() => {
			const controls = this.store.controls() as CameraControls;
			if (!controls) return;

			const gltf = this.gltf.value();
			if (!gltf) return;

			const scene = this.store.scene();
			const rock = this.rockStore.selectedRock();

			const obj = rock ? scene.getObjectByName(rock.name) : gltf.scene;
			if (obj) {
				void controls.fitToBox(obj, true, { paddingTop: 5 });
			}
		});
	}
}
