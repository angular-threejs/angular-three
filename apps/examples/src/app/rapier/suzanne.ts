import { gltfResource } from 'angular-three-soba/loaders';
import { Mesh } from 'three';
import { GLTF } from 'three-stdlib';

type SuzanneGLTF = GLTF & {
	nodes: { Suzanne: Mesh };
};

gltfResource.preload('./suzanne.glb');

export function suzanneResource() {
	return gltfResource<SuzanneGLTF>(() => './suzanne.glb');
}
