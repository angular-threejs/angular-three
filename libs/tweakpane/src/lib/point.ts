import { Directive, inject, input } from '@angular/core';
import { Point2dInputParams, Point3dInputParams, Point4dInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

/**
 * Acceptable value formats for TweakpanePoint.
 * Can be a tuple array `[x, y, z?, w?]` or an object `{ x, y, z?, w? }`.
 */
type AcceptableTweakPointValue =
	| [x: number, y: number, z?: number, w?: number]
	| { x: number; y: number; z?: number; w?: number };

/**
 * Directive for creating a 2D/3D/4D point input control in Tweakpane.
 *
 * Provides two-way binding for point values (as tuple arrays or objects).
 * The control displays input fields for each dimension and optionally
 * shows a 2D picker for x/y values.
 *
 * Values are accepted as arrays `[x, y, z?, w?]` and emitted in the same format.
 *
 * @example
 * ```html
 * <tweakpane-pane>
 *   <!-- 2D point -->
 *   <tweakpane-point label="Position" [(value)]="position2D" />
 *
 *   <!-- 3D point with custom ranges -->
 *   <tweakpane-point
 *     label="Position"
 *     [(value)]="position3D"
 *     [params]="{
 *       x: { min: -10, max: 10 },
 *       y: { min: 0, max: 100 },
 *       z: { min: -10, max: 10 }
 *     }"
 *   />
 *
 *   <!-- 4D point (e.g., quaternion) -->
 *   <tweakpane-point label="Rotation" [(value)]="quaternion" />
 * </tweakpane-pane>
 * ```
 */
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
	/**
	 * Additional Tweakpane point input parameters.
	 * Can include per-axis configuration like `{ x: { min, max }, y: { min, max } }`.
	 * @default {}
	 */
	params = input<Point2dInputParams | Point3dInputParams | Point4dInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
