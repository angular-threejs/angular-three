export const ROUTED_SCENE = '__ngt_renderer_is_routed_scene__';
export const SPECIAL_INTERNAL_ADD_COMMENT = '__ngt_renderer_add_comment__';

export const SPECIAL_DOM_TAG = {
	NGT_PORTAL: 'ngt-portal',
	NGT_PRIMITIVE: 'ngt-primitive',
	NGT_VALUE: 'ngt-value',
} as const;

export const SPECIAL_PROPERTIES = {
	COMPOUND: 'ngtCompound',
	RENDER_PRIORITY: 'priority',
	ATTACH: 'attach',
	VALUE: 'rawValue',
	REF: 'ref',
} as const;

export const SPECIAL_EVENTS = {
	BEFORE_RENDER: 'beforeRender',
	AFTER_UPDATE: 'afterUpdate',
	AFTER_ATTACH: 'afterAttach',
} as const;
