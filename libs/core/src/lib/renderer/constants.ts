/**
 * @fileoverview Internal constants used by the Angular Three renderer.
 *
 * These flags are used to mark DOM nodes and track renderer state.
 * @internal
 */

/** Flag indicating a node is managed by the Angular Three renderer */
export const NGT_RENDERER_NODE_FLAG = '__ngt_renderer__';
/** Flag for canvas content template comments */
export const NGT_CANVAS_CONTENT_FLAG = '__ngt_renderer_canvas_content__';
/** Flag for portal content template comments */
export const NGT_PORTAL_CONTENT_FLAG = '__ngt_renderer_portal_content__';
/** Flag for args directive comments */
export const NGT_ARGS_FLAG = '__ngt_renderer_args__';
/** Flag for parent directive comments */
export const NGT_PARENT_FLAG = '__ngt_renderer_parent__';
/** Internal flag for adding comment nodes */
export const NGT_INTERNAL_ADD_COMMENT_FLAG = '__ngt_renderer_add_comment__';
/** Internal flag for setting parent on comment nodes */
export const NGT_INTERNAL_SET_PARENT_COMMENT_FLAG = '__ngt_renderer_set_parent_comment__';
/** Flag for getting node attributes */
export const NGT_GET_NODE_ATTRIBUTE_FLAG = '__ngt_get_node_attribute__';
/** Flag for DOM parent element reference */
export const NGT_DOM_PARENT_FLAG = '__ngt_dom_parent__';
/** Flag indicating the delegate renderer's destroyNode has been patched */
export const NGT_DELEGATE_RENDERER_DESTROY_NODE_PATCHED_FLAG = '__ngt_delegate_renderer_destroy_node_patched__';
/** Flag for HTML directive classes */
export const NGT_HTML_FLAG = '__ngt_html__';

/** Native Three.js EventDispatcher events */
export const THREE_NATIVE_EVENTS = ['added', 'removed', 'childadded', 'childremoved', 'change', 'disposed'];
