const BLENDING_STYLE_PROPERTIES = ['z-index', 'position', 'pointer-events'] as const;

type BlendingStyleProperty = (typeof BLENDING_STYLE_PROPERTIES)[number];

interface InlineStyleValue {
	value: string;
	priority: string;
}

interface CanvasStyleLeaseState {
	original: Record<BlendingStyleProperty, InlineStyleValue>;
	claims: Map<object, number>;
	zIndexCounts: Map<number, number>;
	maxZIndex: number;
}

const canvasStyleLeases = new WeakMap<HTMLElement, CanvasStyleLeaseState>();

function captureInlineStyles(element: HTMLElement): CanvasStyleLeaseState['original'] {
	return Object.fromEntries(
		BLENDING_STYLE_PROPERTIES.map((property) => [
			property,
			{
				value: element.style.getPropertyValue(property),
				priority: element.style.getPropertyPriority(property),
			},
		]),
	) as CanvasStyleLeaseState['original'];
}

function applyClaims(element: HTMLElement, state: CanvasStyleLeaseState) {
	const zIndex = `${state.maxZIndex}`;
	if (element.style.getPropertyValue('z-index') !== zIndex) element.style.setProperty('z-index', zIndex);
	if (element.style.getPropertyValue('position') !== 'absolute') element.style.setProperty('position', 'absolute');
	if (element.style.getPropertyValue('pointer-events') !== 'none') {
		element.style.setProperty('pointer-events', 'none');
	}
}

function addClaim(state: CanvasStyleLeaseState, token: object, zIndex: number) {
	state.claims.set(token, zIndex);
	state.zIndexCounts.set(zIndex, (state.zIndexCounts.get(zIndex) || 0) + 1);
	state.maxZIndex = Math.max(state.maxZIndex, zIndex);
}

function removeClaim(state: CanvasStyleLeaseState, token: object) {
	const zIndex = state.claims.get(token);
	if (zIndex === undefined) return;

	state.claims.delete(token);
	const count = state.zIndexCounts.get(zIndex)! - 1;
	if (count) state.zIndexCounts.set(zIndex, count);
	else state.zIndexCounts.delete(zIndex);

	if (zIndex === state.maxZIndex && !state.zIndexCounts.has(zIndex)) {
		state.maxZIndex = state.zIndexCounts.size ? Math.max(...state.zIndexCounts.keys()) : Number.NEGATIVE_INFINITY;
	}
}

function restoreInlineStyles(element: HTMLElement, state: CanvasStyleLeaseState) {
	for (const property of BLENDING_STYLE_PROPERTIES) {
		const { value, priority } = state.original[property];
		if (value) element.style.setProperty(property, value, priority);
		else element.style.removeProperty(property);
	}
}

/**
 * Owns the shared canvas styles required by blending HTML overlays.
 * Claims are independent and idempotent; the exact prior inline styles are restored
 * only after the final overlay releases its claim.
 */
export function acquireCanvasStyleLease(element: HTMLElement, initialZIndex: number) {
	let state = canvasStyleLeases.get(element);
	if (!state) {
		state = {
			original: captureInlineStyles(element),
			claims: new Map(),
			zIndexCounts: new Map(),
			maxZIndex: Number.NEGATIVE_INFINITY,
		};
		canvasStyleLeases.set(element, state);
	}

	const token = {};
	let released = false;
	addClaim(state, token, initialZIndex);
	applyClaims(element, state);

	return {
		update(zIndex: number) {
			if (released || state.claims.get(token) === zIndex) return;
			removeClaim(state, token);
			addClaim(state, token, zIndex);
			applyClaims(element, state);
		},
		release() {
			if (released) return;
			released = true;
			removeClaim(state, token);
			if (state.claims.size) {
				applyClaims(element, state);
			} else {
				restoreInlineStyles(element, state);
				canvasStyleLeases.delete(element);
			}
		},
	};
}
