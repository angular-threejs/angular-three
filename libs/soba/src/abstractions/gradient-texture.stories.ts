import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsGradientTexture } from 'angular-three-soba/abstractions';
import { NgtsMeshWobbleMaterial } from 'angular-three-soba/materials';
import { NgtsFloat } from 'angular-three-soba/staging';
import { DoubleSide } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
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
	imports: [NgtsFloat, NgtArgs, NgtsMeshWobbleMaterial, NgtsGradientTexture],
})
class DefaultGradientTextureStory {
	protected readonly DoubleSide = DoubleSide;
}

export default {
	title: 'Abstractions/GradientTexture',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultGradientTextureStory);
