import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	viewChild,
	viewChildren,
} from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtVector3 } from 'angular-three';
import { BoxGeometry, Matrix4, MeshPhongMaterial, Object3D } from 'three';
import { COLORS } from '../constants';
import { GameStore } from '../game.store';

@Component({
    selector: 'app-pilot',
    template: `
		<ngt-object3D [position]="position()">
			<!-- body -->
			<ngt-mesh [position]="[2, -12, 0]">
				<ngt-box-geometry *args="[15, 15, 15]" />
				<ngt-mesh-phong-material [color]="COLORS.brown" [flatShading]="true" />
			</ngt-mesh>

			<!-- face -->
			<ngt-mesh [material]="pinkMaterial">
				<ngt-box-geometry *args="[10, 10, 10]" />
			</ngt-mesh>

			<!-- hair/glass -->
			<ngt-object3D [position]="[-5, 5, 0]">
				<!-- top -->
				<ngt-object3D #topHair>
					@for (hair of hairsCount; track $index) {
						<ngt-mesh
							[position]="[-4 + Math.floor($index / 3) * 4, 0, -4 + ($index % 3) * 4]"
							[material]="brownMaterial"
						>
							<ngt-box-geometry #hairGeometry *args="[4, 4, 4]" />
						</ngt-mesh>
					}
				</ngt-object3D>

				<!-- side R -->
				<ngt-mesh [material]="brownMaterial" [position]="[8, -2, 6]">
					<ngt-box-geometry #sideGeometry *args="[12, 4, 2]" />
				</ngt-mesh>

				<!-- side L -->
				<ngt-mesh [material]="brownMaterial" [position]="[8, -2, -6]">
					<ngt-box-geometry #sideGeometry *args="[12, 4, 2]" />
				</ngt-mesh>

				<!-- back -->
				<ngt-mesh [material]="brownMaterial" [position]="[-1, -4, 0]">
					<ngt-box-geometry *args="[2, 8, 10]" />
				</ngt-mesh>
			</ngt-object3D>

			<!-- glass R -->
			<ngt-mesh [material]="brownMaterial" [position]="[6, 0, 3]">
				<ngt-box-geometry *args="[5, 5, 5]" />
			</ngt-mesh>

			<!-- glass L -->
			<ngt-mesh [material]="brownMaterial" [position]="[6, 0, -3]">
				<ngt-box-geometry *args="[5, 5, 5]" />
			</ngt-mesh>

			<!-- glass A -->
			<ngt-mesh [material]="brownMaterial">
				<ngt-box-geometry *args="[11, 1, 11]" />
			</ngt-mesh>

			<!-- ear R -->
			<ngt-mesh [material]="pinkMaterial" [position]="[0, 0, 6]">
				<ngt-box-geometry *args="[2, 3, 2]" />
			</ngt-mesh>

			<!-- ear L -->
			<ngt-mesh [material]="pinkMaterial" [position]="[0, 0, -6]">
				<ngt-box-geometry *args="[2, 3, 2]" />
			</ngt-mesh>
		</ngt-object3D>
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtArgs]
})
export class Pilot {
	protected readonly Math = Math;
	protected readonly COLORS = COLORS;

	position = input<NgtVector3>([0, 0, 0]);

	protected hairsCount = Array.from({ length: 12 });
	protected pinkMaterial = new MeshPhongMaterial({ color: COLORS.pink });
	protected brownMaterial = new MeshPhongMaterial({ color: COLORS.brown });

	private topHairRef = viewChild.required<ElementRef<Object3D>>('topHair');
	private hairGeometryRef = viewChild<ElementRef<BoxGeometry>>('hairGeometry');
	private sideGeometryRefs = viewChildren<ElementRef<BoxGeometry>>('sideGeometry');

	constructor() {
		const gameStore = inject(GameStore);

		effect(() => {
			const hairGeometry = this.hairGeometryRef()?.nativeElement;
			if (!hairGeometry) return;

			hairGeometry.applyMatrix4(new Matrix4().makeScale(1, 1, 1));
		});

		effect(() => {
			for (const sideGeometry of this.sideGeometryRefs()) {
				sideGeometry.nativeElement.applyMatrix4(new Matrix4().makeTranslation(-6, 0, 0));
			}
		});

		let angleHairs = 0;
		injectBeforeRender(({ delta }) => {
			const topHair = this.topHairRef().nativeElement;

			for (let i = 0; i < topHair.children.length; i++) {
				const child = topHair.children[i];
				child.scale.y = 0.75 + Math.cos(angleHairs + i / 3) * 0.25;
			}

			angleHairs += gameStore.state.speed * delta * 1_000 * 40;
		});
	}
}
