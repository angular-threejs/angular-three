import { Directive, inject, input } from '@angular/core';
import { Point2dInputParams, Point3dInputParams, Point4dInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

type AcceptableTweakPointValue =
	| [x: number, y: number, z?: number, w?: number]
	| { x: number; y: number; z?: number; w?: number };

@Directive({
	selector: 'tweakpane-point',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [
		provideTweakBindingAsHost<AcceptableTweakPointValue, { x: number; y: number; z?: number; w?: number }>({
			in: (value) => {
				if (Array.isArray(value)) {
					const [x, y, z, w] = value;
					return { x, y, z, w };
				}
				return value;
			},
			out: (value) => {
				const { x, y, z, w } = value;
				return [x, y, z, w];
			},
		}),
	],
})
export class TweakpanePoint {
	params = input<Point2dInputParams | Point3dInputParams | Point4dInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
