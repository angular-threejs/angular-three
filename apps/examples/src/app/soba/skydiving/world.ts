import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { textureResource } from 'angular-three-soba/loaders';
import { BackSide } from 'three';

@Component({
	selector: 'app-world',
	template: `
		<ngt-mesh>
			<ngt-sphere-geometry *args="[5, 60, 60]" />
			<ngt-mesh-basic-material [toneMapped]="false" [map]="skyTexture.value()" [side]="BackSide" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class World {
	protected readonly BackSide = BackSide;
	protected skyTexture = textureResource(() => './sky-texture.jpg');
}
