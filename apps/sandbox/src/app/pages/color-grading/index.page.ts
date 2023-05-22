import { RouteMeta } from '@analogjs/router';
import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Signal } from '@angular/core';
import { injectNgtLoader, NgtArgs, NgtCanvas } from 'angular-three';
import { NgtpEffectComposer } from 'angular-three-postprocessing';
import { NgtpLUT } from 'angular-three-postprocessing/effects';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { NgtsStats } from 'angular-three-soba/performance';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { LookupTexture, LUTCubeLoader } from 'postprocessing';

export const routeMeta: RouteMeta = {
    title: 'Color Grading',
};

@Component({
    selector: 'grading-sphere',
    standalone: true,
    templateUrl: 'grading-sphere.html',
    imports: [NgtArgs, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class GradingSphere {
    readonly texture = injectNgtsTextureLoader(() => 'terrazo.png');
}

@Component({
    selector: 'grading-effect',
    standalone: true,
    templateUrl: 'grading-effect.html',
    imports: [NgtpLUT, NgtpEffectComposer, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class GradingEffect {
    readonly texture = injectNgtLoader(
        () => LUTCubeLoader as any,
        () => 'cubicle-99.CUBE'
    ) as Signal<LookupTexture>;
}

@Component({
    standalone: true,
    templateUrl: 'scene.html',
    imports: [GradingSphere, GradingEffect, NgtsEnvironment, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SceneGraph {}

@Component({
    standalone: true,
    templateUrl: 'index.html',
    imports: [NgtCanvas, NgtsStats],
    host: { class: 'block h-full w-full bg-gradient-to-br from-indigo-300 to-sky-700' },
})
export default class ColorGrading {
    readonly scene = SceneGraph;
}
