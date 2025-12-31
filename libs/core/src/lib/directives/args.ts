import { computed, Directive, input, linkedSignal } from '@angular/core';
import { NGT_ARGS_FLAG, NGT_INTERNAL_ADD_COMMENT_FLAG } from '../renderer/constants';
import { NgtCommonDirective } from './common';

/**
 * Structural directive for passing constructor arguments to Three.js elements.
 *
 * The `NgtArgs` directive allows you to pass constructor arguments to Three.js objects
 * when they are created. This is essential for objects that require constructor arguments
 * like geometries, materials, and custom objects.
 *
 * @example
 * ```html
 * <!-- Pass arguments to BoxGeometry constructor -->
 * <ngt-mesh>
 *   <ngt-box-geometry *args="[1, 2, 3]" />
 * </ngt-mesh>
 *
 * <!-- Use with primitive for external objects -->
 * <ngt-primitive *args="[myObject]" />
 * ```
 */
@Directive({ selector: 'ng-template[args]' })
export class NgtArgs extends NgtCommonDirective<any[]> {
	args = input.required<any[] | null>();

	protected linkedValue = linkedSignal(this.args);
	protected shouldSkipRender = computed(() => {
		const args = this.args();
		return args == null || !Array.isArray(args) || (args.length === 1 && args[0] === null);
	});

	constructor() {
		super();

		const commentNode = this.commentNode;
		commentNode.data = NGT_ARGS_FLAG;
		commentNode[NGT_ARGS_FLAG] = true;

		if (commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG]) {
			commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG]('args', this.injector);
			delete commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG];
		}
	}

	validate() {
		return !this.injected && !!this.injectedValue?.length;
	}
}
