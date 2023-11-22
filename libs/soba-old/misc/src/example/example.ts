import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, signal } from '@angular/core';
import { createApiToken, extend, injectNgtRef, signalStore } from 'angular-three-old';
import { NgtsText3D } from 'angular-three-soba-old/abstractions';
import { NgtsCenter } from 'angular-three-soba-old/staging';
import { Group, MeshNormalMaterial, MeshStandardMaterial } from 'three';

/**
 * define states of a component. usually acts for inputs signalStore
 */
export type NgtsExampleState = {
	font: string;
	color: THREE.ColorRepresentation;
	debug: boolean;
	bevelSize: number;
};

/**
 * augment HTMLElementTagNameMap with the selector of the component.
 * the type is usually the Inputs' state and the root THREE element

declare global {
	interface HTMLElementTagNameMap {
		\/**
		 * @extends ngt-group
		 *\/
		'ngts-example': NgtsExampleState & NgtGroup;
	}
}

*/

/**
 * make sure soba's component extends all regular THREE entities that it needs
 */
extend({ Group, MeshNormalMaterial, MeshStandardMaterial });

/**
 * We can setup public API for this soba component with createInjectionToken + forwardRef
 * the `example.api` is **usually** a computed property in the component class
 *
 * @see Bounds for example
 */
export const [injectNgtsExampleApi, provideNgtsExampleApi] = createApiToken(() => NgtsExample);

@Component({
	selector: 'ngts-example',
	standalone: true,
	template: `
		<!-- ngtCompound is used by the Renderer to spread props from ngts-example down to ngt-group -->
		<!-- i.e: <ngts-example [position]="[1, 1, 1]" />, [1, 1, 1] will be passed down to ngt-group -->
		<!-- [ref] is used with the Input so that the consumer can pass an external ref and control this internal ngt-group -->
		<ngt-group ngtCompound [ref]="exampleRef">
			<ngts-center [top]="true">
				<ngts-text-3d [bevelEnabled]="true" [bevelSize]="bevelSize()" [font]="font()" [text]="count().toString()">
					<ngt-mesh-standard-material *ngIf="!debug(); else withDebug" [color]="color()" />
					<ng-template #withDebug>
						<ngt-mesh-normal-material [wireframe]="true" />
					</ng-template>
				</ngts-text-3d>
			</ngts-center>
			<!-- use Content Projection here so consumers can pass in children for ngt-group -->
			<ng-content />
		</ngt-group>
	`,
	/**
	 * can definitely use other Soba components
	 */
	imports: [NgtsCenter, NgtsText3D, NgIf],
	/**
	 * call the API provider here to actually provide the API for the component's children
	 */
	providers: [provideNgtsExampleApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
/**
 * @description this component is only for documentation purposes.
 */
export class NgtsExample {
	/**
	 * use signalStore to store inputs with default inputs
	 */
	private inputs = signalStore<NgtsExampleState>({ color: '#cbcbcb', bevelSize: 0.04, debug: false });

	/**
	 * a soba component usually has a Input for the component ref and this Input always has a default value with injectNgtRef
	 */
	@Input() exampleRef = injectNgtRef<Group>();

	/**
	 * setup Input for the Inputs state. Use alias to have an easier time to setup computed
	 *
	 * @example: this way "private font" and "set _font" won't conflict
	 * private font = this.inputs.select('font');
	 */
	@Input({ alias: 'font', required: true }) set _font(font: string) {
		this.inputs.set({ font });
	}

	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}

	@Input({ alias: 'debug' }) set _debug(debug: boolean) {
		this.inputs.set({ debug });
	}

	@Input({ alias: 'bevelSize' }) set _bevelSize(bevelSize: number) {
		this.inputs.set({ bevelSize });
	}

	/**
	 * exposes signals from inputs
	 */
	bevelSize = this.inputs.select('bevelSize');
	font = this.inputs.select('font');
	debug = this.inputs.select('debug');
	color = this.inputs.select('color');

	/**
	 * can have internal state
	 */
	count = signal(0);

	/**
	 * Expose the public API for this soba component
	 */
	api = computed(() => ({
		bevelSize: this.bevelSize(),
		increment: () => this.count.update((v) => v + 1),
		decrement: () => this.count.update((v) => v - 1),
	}));
}
