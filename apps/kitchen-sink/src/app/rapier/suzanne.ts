import { Signal } from '@angular/core';
import { injectGLTF } from 'angular-three-soba/loaders';
import { Mesh } from 'three';
import { GLTF } from 'three-stdlib';

type SuzanneGLTF = GLTF & {
	nodes: { Suzanne: Mesh };
};

export function injectSuzanne() {
	return injectGLTF(() => './suzanne.glb') as Signal<SuzanneGLTF | null>;
}
