export const ATTRIBUTES = {
	attach: 'attach',
	priority: 'priority',
} as const;

export const PROPERTIES = {
	parameters: 'parameters',
	rawValue: 'rawValue',
} as const;

export const EVENTS = {
	attached: 'attached',
	updated: 'updated',
} as const;

export const ELEMENTS = {
	primitive: 'ngt-primitive',
	value: 'ngt-value',
	portal: 'ngt-portal',
} as const;

export const NGT_RENDERER_TRACKING_COMMENT = '__ngt_renderer_tracking_comment__';
