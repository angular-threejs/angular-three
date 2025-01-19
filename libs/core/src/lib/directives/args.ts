import { computed, Directive, input, linkedSignal } from '@angular/core';
import { NGT_ARGS_FLAG, NGT_INTERNAL_ADD_COMMENT_FLAG } from '../renderer/constants';
import { NgtCommonDirective } from './common';

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
