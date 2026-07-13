import type { ElementRef } from '@angular/core';
import type { NgtRenderState } from 'angular-three';
import type * as THREE from 'three';

/** The stable scene anchor and DOM host associated with one HTML content target. */
export interface NgtsHTMLOcclusionTarget {
	/** The THREE.Group used to position the HTML content. */
	readonly anchor: THREE.Group;
	/** The actual `div[htmlContent]` host element. */
	readonly element: HTMLElement;
}

/** Shared context for one active render frame in an Angular Three store. */
export interface NgtsHTMLOcclusionFrame {
	/** A monotonically increasing frame id scoped to the active render store. */
	readonly id: number;
	/** The active store state, including portal-specific scene and camera values. */
	readonly state: NgtRenderState;
}

/**
 * Lightweight custom occlusion test.
 *
 * Return `true` when the target should be hidden. Reuse the same function
 * instance across targets to avoid unnecessary strategy lifecycle churn.
 */
export type NgtsHTMLOcclusionTest = (target: NgtsHTMLOcclusionTarget, frame: NgtsHTMLOcclusionFrame) => boolean;

/**
 * A reusable occlusion strategy that can coordinate work across HTML content targets.
 *
 * One strategy instance may be shared by any number of targets in a render
 * store. `beginFrame` runs once per active frame with the targets that passed the
 * framework's ancestor-visibility and behind-camera checks, before any
 * `isOccluded` calls for that strategy.
 */
export interface NgtsHTMLOcclusionStrategy {
	/** Set up per-target resources. Return a callback to release them. */
	setupTarget?(target: NgtsHTMLOcclusionTarget): void | (() => void);
	/** Run once before this frame's per-target occlusion tests. */
	beginFrame?(targets: readonly NgtsHTMLOcclusionTarget[], frame: NgtsHTMLOcclusionFrame): void;
	/** Return `true` when this target should be hidden. */
	isOccluded(target: NgtsHTMLOcclusionTarget, frame: NgtsHTMLOcclusionFrame): boolean;
}

/** Supported HTML occlusion modes. */
export type NgtsHTMLOcclusion =
	| readonly ElementRef<THREE.Object3D>[]
	| readonly THREE.Object3D[]
	| boolean
	| 'raycast'
	| 'blending'
	| NgtsHTMLOcclusionTest
	| NgtsHTMLOcclusionStrategy;

const functionStrategies = new WeakMap<NgtsHTMLOcclusionTest, NgtsHTMLOcclusionStrategy>();

export function resolveHTMLOcclusionStrategy(occlusion: NgtsHTMLOcclusion): NgtsHTMLOcclusionStrategy | undefined {
	if (typeof occlusion === 'function') {
		let strategy = functionStrategies.get(occlusion);
		if (!strategy) {
			strategy = { isOccluded: occlusion };
			functionStrategies.set(occlusion, strategy);
		}
		return strategy;
	}

	if (
		typeof occlusion === 'object' &&
		occlusion !== null &&
		!Array.isArray(occlusion) &&
		typeof (occlusion as NgtsHTMLOcclusionStrategy).isOccluded === 'function'
	) {
		return occlusion as NgtsHTMLOcclusionStrategy;
	}

	return undefined;
}
