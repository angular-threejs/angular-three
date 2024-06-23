import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	input,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs, injectBeforeRender } from 'angular-three';
import { NgtsContactShadows, NgtsContactShadowsOptions } from 'angular-three-soba/staging';
import { Mesh } from 'three';
import { color, makeDecorators, makeStoryFunction, makeStoryObject } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh #sphere [position]="[0, 2, 0]">
			<ngt-sphere-geometry *args="[1, 32, 32]" />
			<ngt-mesh-phong-material color="#2A8AFF" />
		</ngt-mesh>

		<ngts-contact-shadows [options]="shadowsOptions()" />

		<ngt-mesh [position]="[0, -0.01, 0]" [rotation]="[-Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[10, 10]" />
		</ngt-mesh>
	`,
	imports: [NgtsContactShadows, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class ContactShadowsStory {
	Math = Math;

	options = input({} as NgtsContactShadowsOptions);
	shadowsOptions = computed(() => ({
		...this.options(),
		position: [0, 0, 0],
		scale: 10,
		far: 3,
		blur: 3,
		rotation: [Math.PI / 2, 0, 0],
	}));

	sphere = viewChild.required<ElementRef<Mesh>>('sphere');

	constructor() {
		injectBeforeRender(({ clock }) => {
			this.sphere().nativeElement.position.y = Math.sin(clock.getElapsedTime()) + 2;
		});
	}
}

export default {
	title: 'Staging/Contact Shadows',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(ContactShadowsStory);
export const Colorized = makeStoryObject(ContactShadowsStory, {
	argsOptions: {
		options: {
			color: color('#2A8AFF'),
		},
	},
});
