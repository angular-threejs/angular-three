import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtArgs, type NgtThreeEvent } from 'angular-three';
import { NgtsExample } from 'angular-three-soba/misc';
import { color, makeDecorators, makeStoryObject, number, select } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['#303030']" attach="background" />
		<ngt-axes-helper />

		<ngts-example
			#example
			[font]="fontUrl"
			[color]="color"
			[bevelSize]="bevelSize"
			[debug]="debug"
			(click)="onClick($event, example)"
		/>
	`,
	imports: [NgtsExample, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultExampleStory {
	@Input() fontUrl = '/soba/fonts/Inter_Bold.json';
	@Input() bevelSize?: number;
	@Input() color = '#cbcbcb';
	@Input() debug = false;

	/**
	 * pointer events are also passed through to the underlying ngt-group
	 */
	onClick(event: NgtThreeEvent<PointerEvent>, example: NgtsExample) {
		/**
		 * we can call the api here or we can injectNgtsExampleApi for ngts-example's children
		 */
		if (event.metaKey) {
			example.api().decrement();
		} else {
			example.api().increment();
		}
	}
}

/**
 * always start with a default export with title and decorators: makeDecorators()
 *  NOTE: we cannot abstract this default export due to Storybook
 */
export default {
	title: 'Misc/Example',
	decorators: makeDecorators(),
};

/**
 * makeStoryObject is an abstraction to easily create a story with argsOptions (args + argsType)
 * Alternatively, we can also use makeStoryFunction if we don't need args
 */
export const Default = makeStoryObject(DefaultExampleStory, {
	/**
	 * these get passed in <ngt-canvas />
	 */
	canvasOptions: { camera: { position: [1, 2, 4], fov: 60 } },
	/**
	 * argsOptions, should match story's Inputs. Use helpers like number(), color(), and select()
	 */
	argsOptions: {
		fontUrl: select('/soba/fonts/Inter_Bold.json', {
			options: ['/soba/fonts/Inter_Bold.json', '/soba/fonts/helvetiker_regular.typeface.json'],
		}),
		bevelSize: number(0.05, { range: true, min: 0, max: 0.1, step: 0.01 }),
		color: color('#cbcbcb'),
		debug: false,
	},
});
