import { Directive, Input } from '@angular/core';
import { NgtSignalStore } from 'angular-three';

export interface NgtsSpotLightInputState {
    depthBuffer?: THREE.DepthTexture;
    angle: number;
    distance: number;
    attenuation: number;
    anglePower: number;
    radiusTop: number;
    radiusBottom: number;
    opacity: number;
    color: string | number;
    debug: boolean;
}

@Directive()
export abstract class NgtsSpotLightInput extends NgtSignalStore<NgtsSpotLightInputState> {
    @Input() set depthBuffer(depthBuffer: THREE.DepthTexture) {
        this.set({ depthBuffer });
    }

    @Input() set angle(angle: number) {
        this.set({ angle });
    }

    @Input() set distance(distance: number) {
        this.set({ distance });
    }

    @Input() set attenuation(attenuation: number) {
        this.set({ attenuation });
    }

    @Input() set anglePower(anglePower: number) {
        this.set({ anglePower });
    }

    @Input() set radiusTop(radiusTop: number) {
        this.set({ radiusTop });
    }

    @Input() set radiusBottom(radiusBottom: number) {
        this.set({ radiusBottom });
    }

    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    @Input() set color(color: string | number) {
        this.set({ color });
    }

    @Input() set debug(debug: boolean) {
        this.set({ debug });
    }

    readonly lightDebug = this.select('debug');
    readonly lightColor = this.select('color');
    readonly lightOpacity = this.select('opacity');
    readonly lightRadiusBottom = this.select('radiusBottom');
    readonly lightRadiusTop = this.select('radiusTop');
    readonly lightAnglePower = this.select('anglePower');
    readonly lightAttenuation = this.select('attenuation');
    readonly lightDistance = this.select('distance');
    readonly lightAngle = this.select('angle');
    readonly lightDepthBuffer = this.select('depthBuffer');
}
