import * as THREE from 'three';
import type { NgtCanvasElement, NgtDpr, NgtGLDefaultOptions, NgtGLOptions, NgtIntersection, NgtSize } from '../types';
import { is } from './is';

const idCache: { [id: string]: boolean | undefined } = {};

/**
 * Generates a unique identifier.
 *
 * When called with an intersection event, creates a deterministic ID based on
 * the object UUID, index, and instance ID. Otherwise, generates a new UUID.
 *
 * @param event - Optional intersection event to generate ID from
 * @returns A unique string identifier
 */
export function makeId(event?: NgtIntersection): string {
	if (event) {
		return (event.eventObject || event.object).uuid + '/' + event.index + event.instanceId;
	}

	const newId = THREE.MathUtils.generateUUID();
	// ensure not already used
	if (!idCache[newId]) {
		idCache[newId] = true;
		return newId;
	}
	return makeId();
}

/**
 * Resolves the device pixel ratio within specified bounds.
 *
 * When given a range [min, max], clamps the device's actual DPR to this range.
 * Falls back to 2x DPR in environments where it cannot be detected (e.g., workers).
 *
 * @param dpr - A single DPR value or [min, max] range
 * @param window - Optional window object to get devicePixelRatio from
 * @returns The resolved DPR value
 */
export function makeDpr(dpr: NgtDpr, window?: Window) {
	// Err on the side of progress by assuming 2x dpr if we can't detect it
	// This will happen in workers where window is defined but dpr isn't.
	const target = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 2) : 1;
	return Array.isArray(dpr) ? Math.min(Math.max(dpr[0], target), dpr[1]) : dpr;
}

/**
 * Creates a WebGL renderer instance with sensible defaults.
 *
 * If a custom renderer is provided via glOptions, it will be used directly.
 * Otherwise, creates a new WebGLRenderer with high-performance defaults.
 *
 * @typeParam TCanvas - The type of canvas element
 * @param glOptions - Renderer configuration or custom renderer
 * @param canvas - The canvas element to render to
 * @returns A WebGLRenderer instance
 */
export function makeRendererInstance<TCanvas extends NgtCanvasElement>(
	glOptions: NgtGLOptions,
	canvas: TCanvas,
): THREE.WebGLRenderer {
	const defaultOptions: NgtGLDefaultOptions = {
		powerPreference: 'high-performance',
		canvas,
		antialias: true,
		alpha: true,
	};

	const customRenderer = (
		typeof glOptions === 'function' ? glOptions(defaultOptions) : glOptions
	) as THREE.WebGLRenderer;
	if (is.renderer(customRenderer)) return customRenderer;
	return new THREE.WebGLRenderer({ ...defaultOptions, ...glOptions });
}

/**
 * Creates a camera instance based on the projection type.
 *
 * @param isOrthographic - Whether to create an orthographic camera
 * @param size - The viewport size for calculating aspect ratio
 * @returns Either an OrthographicCamera or PerspectiveCamera
 */
export function makeCameraInstance(isOrthographic: boolean, size: NgtSize) {
	if (isOrthographic) return new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 1000);
	return new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
}

/**
 * Type representing a parsed object graph from a loaded 3D model.
 *
 * Contains maps of named nodes, materials, and meshes for easy access.
 */
export type NgtObjectMap = {
	/** Map of named Object3D nodes */
	nodes: Record<string, THREE.Object3D<any>>;
	/** Map of named materials */
	materials: Record<string, THREE.Material>;
	/** Map of named meshes */
	meshes: Record<string, THREE.Mesh>;
	[key: string]: any;
};

/**
 * Creates an object graph from a Three.js scene hierarchy.
 *
 * Traverses the object and extracts named nodes, materials, and meshes
 * into lookup tables for convenient access.
 *
 * @param object - The root Object3D to traverse
 * @returns An object containing nodes, materials, and meshes maps
 *
 * @example
 * ```typescript
 * const gltf = await loader.loadAsync('model.gltf');
 * const { nodes, materials } = makeObjectGraph(gltf.scene);
 * // Access named objects: nodes['MyMesh'], materials['MyMaterial']
 * ```
 */
export function makeObjectGraph(object: THREE.Object3D): NgtObjectMap {
	const data: NgtObjectMap = { nodes: {}, materials: {}, meshes: {} };

	if (object) {
		object.traverse((child) => {
			if (child.name) data.nodes[child.name] = child;
			if ('material' in child && !data.materials[((child as THREE.Mesh).material as THREE.Material).name]) {
				data.materials[((child as THREE.Mesh).material as THREE.Material).name] = (child as THREE.Mesh)
					.material as THREE.Material;
			}
			if (is.three<THREE.Mesh>(child, 'isMesh') && !data.meshes[child.name]) data.meshes[child.name] = child;
		});
	}
	return data;
}
