import { Material, MathUtils, Mesh, Object3D, OrthographicCamera, PerspectiveCamera, WebGLRenderer } from 'three';
import { NgtCanvasElement, NgtDpr, NgtGLOptions, NgtIntersection, NgtSize } from '../types';
import { is } from './is';

const idCache: { [id: string]: boolean | undefined } = {};
export function makeId(event?: NgtIntersection): string {
	if (event) {
		return (event.eventObject || event.object).uuid + '/' + event.index + event.instanceId;
	}

	const newId = MathUtils.generateUUID();
	// ensure not already used
	if (!idCache[newId]) {
		idCache[newId] = true;
		return newId;
	}
	return makeId();
}

export function makeDpr(dpr: NgtDpr, window?: Window) {
	// Err on the side of progress by assuming 2x dpr if we can't detect it
	// This will happen in workers where window is defined but dpr isn't.
	const target = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 2) : 1;
	return Array.isArray(dpr) ? Math.min(Math.max(dpr[0], target), dpr[1]) : dpr;
}

export function makeRendererInstance<TCanvas extends NgtCanvasElement>(
	glOptions: NgtGLOptions,
	canvas: TCanvas,
): WebGLRenderer {
	const customRenderer = (typeof glOptions === 'function' ? glOptions(canvas) : glOptions) as WebGLRenderer;
	if (is.renderer(customRenderer)) return customRenderer;
	return new WebGLRenderer({
		powerPreference: 'high-performance',
		canvas,
		antialias: true,
		alpha: true,
		...glOptions,
	});
}

export function makeCameraInstance(isOrthographic: boolean, size: NgtSize) {
	if (isOrthographic) return new OrthographicCamera(0, 0, 0, 0, 0.1, 1000);
	return new PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
}

export type NgtObjectMap = {
	nodes: Record<string, Object3D<any>>;
	materials: Record<string, Material>;
	[key: string]: any;
};

export function makeObjectGraph(object: Object3D): NgtObjectMap {
	const data: NgtObjectMap = { nodes: {}, materials: {} };

	if (object) {
		object.traverse((child: Object3D) => {
			if (child.name) data.nodes[child.name] = child;
			if ('material' in child && !data.materials[((child as Mesh).material as Material).name]) {
				data.materials[((child as Mesh).material as Material).name] = (child as Mesh).material as Material;
			}
		});
	}
	return data;
}
