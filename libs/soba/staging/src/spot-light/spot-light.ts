import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, InjectionToken, Input } from '@angular/core';
import { NgtArgs, NgtInjectedRef, extend, injectNgtRef } from 'angular-three';
import { Group, SpotLight, SpotLightHelper } from 'three';
import { NgtsSpotLightInput } from './spot-light-input';
import { NgtsVolumetricMesh } from './volumetric-mesh';

extend({ SpotLight, SpotLightHelper, Group });

declare module './spot-light-input' {
    interface NgtsSpotLightInputState {
        volumetric: boolean;
    }
}

export type NgtsSpotLightApi = {
    spotLight: NgtInjectedRef<THREE.SpotLight>;
    debug: () => boolean;
};

export const NGTS_SPOT_LIGHT_API = new InjectionToken<NgtsSpotLightApi>('NgtsSpotLight API');

function spotLightApiFactory(spotLight: NgtsSpotLight): NgtsSpotLightApi {
    return {
        spotLight: spotLight.spotLightRef,
        debug: spotLight.lightDebug,
    };
}

@Component({
    selector: 'ngts-spot-light',
    standalone: true,
    template: `
        <ngt-group>
            <ng-container *ngIf="lightDebug() && spotLightRef.nativeElement">
                <ngt-spot-light-helper *args="[spotLightRef.untracked]" />
            </ng-container>
            <ngt-spot-light
                ngtCompound
                [ref]="spotLightRef"
                [color]="lightColor()"
                [distance]="lightDistance()"
                [angle]="lightAngle()"
                [castShadow]="true"
            >
                <ngts-volumetric-mesh
                    *ngIf="showVolumetric()"
                    [debug]="lightDebug()"
                    [opacity]="lightOpacity()"
                    [radiusTop]="lightRadiusTop()"
                    [radiusBottom]="lightRadiusBottom()"
                    [depthBuffer]="lightDepthBuffer()"
                    [color]="lightColor()"
                    [distance]="lightDistance()"
                    [angle]="lightAngle()"
                    [attenuation]="lightAttenuation()"
                    [anglePower]="lightAnglePower()"
                />
            </ngt-spot-light>
            <ng-content />
        </ngt-group>
    `,
    providers: [{ provide: NGTS_SPOT_LIGHT_API, useFactory: spotLightApiFactory, deps: [NgtsSpotLight] }],
    imports: [NgIf, NgtArgs, NgtsVolumetricMesh],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLight extends NgtsSpotLightInput {
    @Input() spotLightRef = injectNgtRef<THREE.SpotLight>();

    @Input() set volumetric(volumetric: boolean) {
        this.set({ volumetric });
    }

    readonly showVolumetric = this.select('volumetric');

    constructor() {
        super();
        this.set({
            opacity: 1,
            color: 'white',
            distance: 5,
            angle: 0.15,
            attenuation: 5,
            anglePower: 5,
            volumetric: true,
            debug: false,
        });
    }
}
