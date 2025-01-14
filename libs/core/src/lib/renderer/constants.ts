export const ROUTED_SCENE = '__ngt_renderer_is_routed_scene__';
export const HTML = '__ngt_renderer_is_html';
export const NON_ROOT = '__ngt_renderer_is_non_root__';
export const SPECIAL_INTERNAL_ADD_COMMENT = '__ngt_renderer_add_comment__';
export const SPECIAL_INTERNAL_SET_PARENT_COMMENT = '__ngt_renderer_set_parent_comment__';
export const DOM_PARENT = '__ngt_dom_parent__';

export const SPECIAL_DOM_TAG = {
	NGT_PORTAL: 'ngt-portal',
	NGT_PRIMITIVE: 'ngt-primitive',
	NGT_VALUE: 'ngt-value',
} as const;

export const SPECIAL_PROPERTIES = {
	RENDER_PRIORITY: 'priority',
	ATTACH: 'attach',
	RAW_VALUE: 'rawValue',
	PARAMETERS: 'parameters',
} as const;

export const SPECIAL_EVENTS = {
	BEFORE_RENDER: 'beforeRender',
	UPDATED: 'updated',
	ATTACHED: 'attached',
} as const;

export const THREE_NATIVE_EVENTS = ['added', 'removed', 'childadded', 'childremoved', 'disposed'];
