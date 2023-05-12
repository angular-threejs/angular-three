import { Directive, Input } from '@angular/core';
import { NgtSignalStore } from 'angular-three';

export interface NgtsSpotLightShadowMeshInputState {
    distance: number;
    alphaTest: number;
    scale: number;
    map: THREE.Texture;
    shader: string;
    width: number;
    height: number;
}

@Directive()
export abstract class NgtsSpotLightShadowMeshInput extends NgtSignalStore<NgtsSpotLightShadowMeshInputState> {
    @Input() set distance(distance: number) {
        this.set({ distance });
    }

    @Input() set alphaTest(alphaTest: number) {
        this.set({ alphaTest });
    }

    @Input() set scale(scale: number) {
        this.set({ scale });
    }

    @Input() set map(map: THREE.Texture) {
        this.set({ map });
    }

    @Input() set shader(shader: string) {
        this.set({ shader });
    }

    @Input() set width(width: number) {
        this.set({ width });
    }

    @Input() set height(height: number) {
        this.set({ height });
    }

    readonly shadowMeshDistance = this.select('distance');
    readonly shadowMeshAlphaTest = this.select('alphaTest');
    readonly shadowMeshScale = this.select('scale');
    readonly shadowMeshMap = this.select('map');
    readonly shadowMeshShader = this.select('shader');
    readonly shadowMeshWidth = this.select('width');
    readonly shadowMeshHeight = this.select('height');
}
