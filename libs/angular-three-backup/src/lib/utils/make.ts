import * as THREE from 'three';
import type { NgtDpr, NgtGLOptions, NgtIntersection, NgtObjectMap, NgtSize } from '../types';

const idCache: { [id: string]: boolean | undefined } = {};
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

export function makeDpr(dpr: NgtDpr, window?: Window) {
    const target = window?.devicePixelRatio || 1;
    return Array.isArray(dpr) ? Math.min(Math.max(dpr[0], target), dpr[1]) : dpr;
}

export function makeDefaultCamera(isOrthographic: boolean, size: NgtSize) {
    if (isOrthographic) return new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 1000);
    return new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
}

export function makeDefaultRenderer(glOptions: NgtGLOptions, canvasElement: HTMLCanvasElement): THREE.WebGLRenderer {
    const customRenderer = (
        typeof glOptions === 'function' ? glOptions(canvasElement) : glOptions
    ) as THREE.WebGLRenderer;

    if (customRenderer?.render != null) return customRenderer;

    return new THREE.WebGLRenderer({
        powerPreference: 'high-performance',
        canvas: canvasElement,
        antialias: true,
        alpha: true,
        ...(glOptions || {}),
    });
}

export function makeObjectGraph(object: THREE.Object3D): NgtObjectMap {
    const data: NgtObjectMap = { nodes: {}, materials: {} };

    if (object) {
        object.traverse((child: THREE.Object3D) => {
            if (child.name) data.nodes[child.name] = child;
            if ('material' in child && !data.materials[((child as THREE.Mesh).material as THREE.Material).name]) {
                data.materials[((child as THREE.Mesh).material as THREE.Material).name] = (child as THREE.Mesh)
                    .material as THREE.Material;
            }
        });
    }
    return data;
}
