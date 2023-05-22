import { RouteMeta } from '@analogjs/router';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive } from '@angular/core';
import { NgtArgs, NgtCanvas, injectBeforeRender } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { injectSphere } from 'angular-three-cannon/services';
import { NgtpEffectComposer } from 'angular-three-postprocessing';
import { NgtpBloom } from 'angular-three-postprocessing/effects';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { NgtsEnvironment, NgtsSky } from 'angular-three-soba/staging';
import * as THREE from 'three';

export const routeMeta: RouteMeta = {
    title: 'Object Clump w/ Physics',
};

@Directive({ selector: 'clump-pointer', standalone: true })
class Pointer {
    readonly pointerBody = injectSphere(() => ({ type: 'Kinematic', args: [3], position: [0, 0, 0] }));

    constructor() {
        injectBeforeRender(({ pointer, viewport }) => {
            this.pointerBody.api().position.set((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0);
        });
    }
}

const mat = new THREE.Matrix4();
const vec = new THREE.Vector3();

@Component({
    selector: 'object-clump',
    standalone: true,
    templateUrl: 'object-clump.html',
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class ObjectClump {
    readonly count = 40;
    readonly texture = injectNgtsTextureLoader(() => 'cross.jpg');

    readonly sphereBody = injectSphere<THREE.InstancedMesh>(() => ({
        args: [1],
        mass: 1,
        angularDamping: 0.1,
        linearDamping: 0.65,
        position: [
            THREE.MathUtils.randFloatSpread(20),
            THREE.MathUtils.randFloatSpread(20),
            THREE.MathUtils.randFloatSpread(20),
        ],
    }));

    onBeforeRender(object: THREE.InstancedMesh) {
        for (let i = 0; i < this.count; i++) {
            // Get current whereabouts of the instanced sphere
            object.getMatrixAt(i, mat);
            // Normalize the position and multiply by a negative force.
            // This is enough to drive it towards the center-point.
            this.sphereBody
                .api()
                .at(i)
                .applyForce(vec.setFromMatrixPosition(mat).normalize().multiplyScalar(-50).toArray(), [0, 0, 0]);
        }
    }
}

@Component({
    standalone: true,
    templateUrl: 'scene.html',
    imports: [NgtArgs, NgtcPhysics, NgtsEnvironment, NgtsSky, NgtpEffectComposer, NgtpBloom, ObjectClump, Pointer],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SceneGraph {}

@Component({
    standalone: true,
    templateUrl: 'index.html',
    imports: [NgtCanvas],
})
export default class Clump {
    readonly scene = SceneGraph;
}
