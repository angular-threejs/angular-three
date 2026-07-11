/**
 * @fileoverview Internal constants used by the Angular Three renderer.
 *
 * These flags are used to mark DOM nodes and track renderer state.
 * @internal
 */

/** Flag indicating a node is managed by the Angular Three renderer */
export const NGT_RENDERER_NODE_FLAG = '__ngt_renderer__';
/** Internal hook for scoping structural directive context to embedded view creation */
export const NGT_RENDERER_CONTEXT_FLAG = '__ngt_renderer_context__';
/** Flag for getting node attributes */
export const NGT_GET_NODE_ATTRIBUTE_FLAG = '__ngt_get_node_attribute__';
/** Flag for DOM parent element reference */
export const NGT_DOM_PARENT_FLAG = '__ngt_dom_parent__';
/** Flag for HTML directive classes */
export const NGT_HTML_FLAG = '__ngt_html__';

/** Native Three.js EventDispatcher events */
export const THREE_NATIVE_EVENTS = ['added', 'removed', 'childadded', 'childremoved', 'change', 'disposed'];
