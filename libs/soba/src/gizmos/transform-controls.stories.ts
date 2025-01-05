import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, signal, viewChild } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtMesh } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsTransformControls, NgtsTransformControlsOptions } from 'angular-three-soba/gizmos';
import { makeDecorators, makeStoryFunction, makeStoryObject, select } from '../setup-canvas';

@Component({
	template: `
		<ngt-mesh #meshOne [position]="[-1, 0, 0]" (click)="selected.set(meshOne)">
			<ngt-box-geometry />
			<ngt-mesh-basic-material [wireframe]="selected() === meshOne" color="orange" />
		</ngt-mesh>
		<ngt-mesh #meshTwo [position]="[0, 0, 0]" (click)="selected.set(meshTwo)">
			<ngt-box-geometry />
			<ngt-mesh-basic-material [wireframe]="selected() === meshTwo" color="green" />
		</ngt-mesh>

		@if (selected(); as selected) {
			<ngts-transform-controls [object]="$any(selected)" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsTransformControls],
	host: {
		'(document:keydown)': 'onKeyDown($event)',
	},
})
class WithSelectionStory {
	selected = signal<NgtMesh | null>(null);

	onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			this.selected.set(null);
		}
	}
}

@Component({
	imports: [NgtsTransformControls, NgtsOrbitControls],
	template: `
		<ngts-transform-controls>
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-basic-material [wireframe]="true" />
			</ngt-mesh>
		</ngts-transform-controls>

		<ngts-orbit-controls [options]="{ makeDefault: true }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class LockControlsStory {}

@Component({
	template: `
		<ngts-transform-controls [options]="{ mode: mode() }">
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-basic-material [wireframe]="true" />
			</ngt-mesh>
		</ngts-transform-controls>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsTransformControls],
	host: {
		'(document:keydown)': 'onKeyDown($event)',
	},
})
class DefaultTransformControlsStory {
	mode = input<NgtsTransformControlsOptions['mode']>('translate');

	private transformControls = viewChild.required(NgtsTransformControls);

	onKeyDown(event: KeyboardEvent) {
		const transformControls = this.transformControls().controls();
		if (event.key === 'Escape') {
			transformControls.reset();
		}
	}
}

export default {
	title: 'Gizmos/TransformControls',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultTransformControlsStory, {
	argsOptions: {
		mode: select('translate', { options: ['translate', 'rotate', 'scale'] }),
	},
});
export const LockControls = makeStoryFunction(LockControlsStory, { controls: false });
export const WithSelection = makeStoryFunction(WithSelectionStory);
