import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsGradientTexture } from 'angular-three-soba/abstractions';
import { NgtsMeshWobbleMaterial } from 'angular-three-soba/materials';
import { NgtsFloat } from 'angular-three-soba/staging';
import { DoubleSide } from 'three';

@Component({
	selector: 'gradient-texture-scene',
	standalone: true,
	template: `
		<ngts-float>
			<ngt-mesh [scale]="[2, 4, 1]">
				<ngt-plane-geometry *args="[1, 1, 32, 32]" />
				<ngts-mesh-wobble-material [options]="{ side: DoubleSide }">
					<ngts-gradient-texture
						[stops]="[0, 0.8, 1]"
						[colors]="['#e63946', '#f1faee', '#a8dadc']"
						[options]="{ size: 100 }"
					/>
				</ngts-mesh-wobble-material>
			</ngt-mesh>
		</ngts-float>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsFloat, NgtsFloat, NgtsMeshWobbleMaterial, NgtsGradientTexture, NgtArgs],
})
export default class GradientTextureScene {
	protected readonly DoubleSide = DoubleSide;
}
