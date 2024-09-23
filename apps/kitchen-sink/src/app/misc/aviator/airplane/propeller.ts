import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { BoxGeometry, Mesh, MeshPhongMaterial } from 'three';
import { COLORS } from '../constants';
import { GameStore } from '../game.store';

@Component({
	selector: 'app-propeller',
	standalone: true,
	template: `
		<ngt-mesh #propeller [castShadow]="true" [receiveShadow]="true" [position]="[60, 0, 0]">
			<ngt-box-geometry #propellerGeometry *args="[20, 10, 10]" />
			<ngt-mesh-phong-material [color]="COLORS.brown" [flatShading]="true" />

			<!-- blade 1 -->
			<ngt-mesh
				[position]="[8, 0, 0]"
				[castShadow]="true"
				[receiveShadow]="true"
				[material]="bladeMaterial"
				[geometry]="bladeGeometry"
			/>

			<!-- blade 2 -->
			<ngt-mesh
				[position]="[8, 0, 0]"
				[rotation]="[Math.PI / 2, 0, 0]"
				[castShadow]="true"
				[receiveShadow]="true"
				[material]="bladeMaterial"
				[geometry]="bladeGeometry"
			/>
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Propeller {
	protected readonly COLORS = COLORS;
	protected readonly Math = Math;
	protected bladeGeometry = new BoxGeometry(1, 80, 10);
	protected bladeMaterial = new MeshPhongMaterial({ color: COLORS.brownDark, flatShading: true });

	private propellerRef = viewChild.required<ElementRef<Mesh>>('propeller');
	private propellerGeometryRef = viewChild<ElementRef<BoxGeometry>>('propellerGeometry');

	constructor() {
		const gameStore = inject(GameStore);

		effect(() => {
			const propellerGeometry = this.propellerGeometryRef()?.nativeElement;
			if (!propellerGeometry) return;

			propellerGeometry.attributes['position'].array[4 * 3 + 1] -= 5;
			propellerGeometry.attributes['position'].array[4 * 3 + 2] += 5;
			propellerGeometry.attributes['position'].array[5 * 3 + 1] -= 5;
			propellerGeometry.attributes['position'].array[5 * 3 + 2] -= 5;
			propellerGeometry.attributes['position'].array[6 * 3 + 1] += 5;
			propellerGeometry.attributes['position'].array[6 * 3 + 2] += 5;
			propellerGeometry.attributes['position'].array[7 * 3 + 1] += 5;
			propellerGeometry.attributes['position'].array[7 * 3 + 2] -= 5;
		});

		injectBeforeRender(({ delta }) => {
			const propeller = this.propellerRef().nativeElement;
			propeller.rotation.x += 0.1 + gameStore.state.planeSpeed * delta * 1_000 * 0.005;
		});
	}
}
