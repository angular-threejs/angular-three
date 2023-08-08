import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, ViewChild } from '@angular/core';
import { NgtArgs, injectBeforeRender } from 'angular-three';
import { NgtsShadow } from 'angular-three-soba/misc';
import { Mesh } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh #icosahedron [position]="[0, 2, 0]">
			<ngt-icosahedron-geometry *args="[1, 2]" />
			<ngt-mesh-basic-material color="lightblue" [wireframe]="true" />
		</ngt-mesh>

		<ngts-shadow #shadow [scale]="2" [position]="[0, 0.1, 0]" [rotation]="[-Math.PI / 2, 0, 0]" />

		<ngt-mesh [rotation]="[-Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[4, 4]" />
			<ngt-mesh-basic-material color="white" />
		</ngt-mesh>
	`,
	imports: [NgtsShadow, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultShadowStory {
	Math = Math;

	@ViewChild('icosahedron', { static: true }) icosahedron!: ElementRef<Mesh>;
	@ViewChild('shadow', { static: true }) shadow!: NgtsShadow;

	constructor() {
		injectBeforeRender(({ clock }) => {
			const icosahedron = this.icosahedron.nativeElement;
			const shadow = this.shadow.shadowRef.nativeElement;

			if (icosahedron && shadow) {
				shadow.scale.x = Math.sin(clock.getElapsedTime()) + 3;
				shadow.scale.y = Math.sin(clock.getElapsedTime()) + 3;

				icosahedron.position.y = Math.sin(clock.getElapsedTime()) + 2.5;
			}
		});
	}
}

export default {
	title: 'Misc/Shadow',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultShadowStory);
