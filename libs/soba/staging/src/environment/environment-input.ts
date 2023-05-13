import { Directive, ElementRef, Input, computed } from '@angular/core';
import { NgtSignalStore } from 'angular-three';
import { Loader, Scene, Texture, TextureEncoding } from 'three';
import { NgtsEnvironmentPresetsType } from './assets';

export interface NgtsEnvironmentInputState {
    frames: number;
    near: number;
    far: number;
    resolution: number;
    background: boolean | 'only';
    blur: number;
    map: Texture;
    files: string | string[];
    path: string;
    preset: NgtsEnvironmentPresetsType;
    scene: Scene | ElementRef<Scene>;
    extensions: (loader: Loader) => void;
    ground: boolean | { radius?: number; height?: number; scale?: number };
    encoding: TextureEncoding;
}

@Directive()
export abstract class NgtsEnvironmentInput extends NgtSignalStore<NgtsEnvironmentInputState> {
    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    @Input() set near(near: number) {
        this.set({ near });
    }

    @Input() set far(far: number) {
        this.set({ far });
    }

    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }

    @Input() set background(background: boolean | 'only') {
        this.set({ background });
    }

    @Input() set blur(blur: number) {
        this.set({ blur });
    }

    @Input() set map(map: Texture) {
        this.set({ map });
    }

    @Input() set files(files: string | string[]) {
        this.set({ files });
    }

    @Input() set path(path: string) {
        this.set({ path });
    }

    @Input() set preset(preset: NgtsEnvironmentPresetsType) {
        this.set({ preset });
    }

    @Input() set scene(scene: Scene | ElementRef<Scene>) {
        this.set({ scene });
    }

    @Input() set extensions(extensions: (loader: Loader) => void) {
        this.set({ extensions });
    }

    @Input() set ground(ground: boolean | { radius?: number; height?: number; scale?: number }) {
        this.set({ ground });
    }

    @Input() set encoding(encoding: TextureEncoding) {
        this.set({ encoding });
    }

    readonly environmentFrames = this.select('frames');
    readonly environmentNear = this.select('near');
    readonly environmentFar = this.select('far');
    readonly environmentResolution = this.select('resolution');
    readonly environmentBackground = this.select('background');
    readonly environmentBlur = this.select('blur');
    readonly environmentMap = this.select('map');
    readonly environmentFiles = this.select('files');
    readonly environmentPath = this.select('path');
    readonly environmentPreset = this.select('preset');
    readonly environmentScene = this.select('scene');
    readonly environmentExtensions = this.select('extensions');
    readonly environmentGround = this.select('ground');
    readonly environmentEncoding = this.select('encoding');

    readonly environmentParams = computed(() => ({
        files: this.environmentFiles(),
        path: this.environmentPath(),
        preset: this.environmentPreset(),
        extensions: this.environmentExtensions(),
        encoding: this.environmentEncoding(),
    }));
}
