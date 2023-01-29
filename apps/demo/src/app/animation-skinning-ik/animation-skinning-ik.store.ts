import { Injectable } from '@angular/core';
import { applyProps, NgtRxStore } from 'angular-three';
import { filter } from 'rxjs';
import * as THREE from 'three';
import { CCDIKSolver, IKS, OrbitControls, TransformControls } from 'three-stdlib';

type OOI = 'head' | 'lowerarm_l' | 'Upperarm_l' | 'hand_l' | 'target_hand_l' | 'sphere' | 'kira';

interface AnimationSkinningIKState {
    OOI: Record<OOI, THREE.Object3D>;
    orbitControls: OrbitControls;
    transformControls: TransformControls;
    cubeRenderTarget: THREE.WebGLCubeRenderTarget;
    material: THREE.MeshBasicMaterial;
    solver: CCDIKSolver;
}

@Injectable()
export class AnimationSkinningIKStore extends NgtRxStore<AnimationSkinningIKState> {
    readonly iks = [
        {
            target: 22, // "target_hand_l"
            effector: 6, // "hand_l"
            links: [
                {
                    index: 5, // "lowerarm_l"
                    enabled: true,
                    rotationMin: new THREE.Vector3(1.2, -1.8, -0.4),
                    rotationMax: new THREE.Vector3(1.7, -1.1, 0.3),
                },
                {
                    index: 4, // "Upperarm_l"
                    enabled: true,
                    rotationMin: new THREE.Vector3(0.1, -0.7, -1.8),
                    rotationMax: new THREE.Vector3(1.1, 0, -1.4),
                },
            ],
        },
    ];

    override initialize() {
        super.initialize();
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
        this.set({
            OOI: {} as AnimationSkinningIKState['OOI'],
            cubeRenderTarget,
            material: new THREE.MeshBasicMaterial({ envMap: cubeRenderTarget.texture }),
        });
    }

    kiraReady() {
        this.hold(this.select('OOI').pipe(filter((ooi) => !!Object.keys(ooi).length)), (ooi) => {
            this.orbitControls.target.copy(ooi.sphere.position);
            ooi.hand_l.attach(ooi.sphere);
            applyProps(ooi.sphere, { material: this.get('material') });

            this.transformControls.attach(ooi.target_hand_l);
            ooi.kira.add((ooi.kira as THREE.SkinnedMesh).skeleton.bones[0]);
            this.set({ solver: new CCDIKSolver(ooi.kira as THREE.SkinnedMesh, this.iks as unknown as IKS[]) });
        });
    }

    get OOI() {
        return this.get('OOI');
    }

    get orbitControls() {
        return this.get('orbitControls');
    }

    get transformControls() {
        return this.get('transformControls');
    }

    get solver() {
        return this.get('solver');
    }
}
