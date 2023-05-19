import { Directive, ElementRef, Input, computed } from '@angular/core';
import { NgtSignalStore } from 'angular-three';
import { Loader, Scene, Texture, TextureEncoding } from 'three';
import { NgtsEnvironmentPresetsType } from './assets';

export interface NgtsEnvironmentInputState {
    frames?: number;
    near?: number;
    far?: number;
    resolution?: number;
    background?: boolean | 'only';
    blur?: number;
    map?: Texture;
    files?: string | string[];
    path?: string;
    preset?: NgtsEnvironmentPresetsType;
    scene?: Scene | ElementRef<Scene>;
    extensions?: (loader: Loader) => void;
    ground?: boolean | { radius?: number; height?: number; scale?: number };
    encoding?: TextureEncoding;
}

@Directive()
export abstract class NgtsEnvironmentInput extends NgtSignalStore<NgtsEnvironmentInputState> {
    @Input() set frames(frames: NgtsEnvironmentInputState['frames']) {
        this.set({ frames });
    }

    @Input() set near(near: NgtsEnvironmentInputState['near']) {
        this.set({ near });
    }

    @Input() set far(far: NgtsEnvironmentInputState['far']) {
        this.set({ far });
    }

    @Input() set resolution(resolution: NgtsEnvironmentInputState['resolution']) {
        this.set({ resolution });
    }

    @Input() set background(background: NgtsEnvironmentInputState['background']) {
        this.set({ background });
    }

    @Input() set blur(blur: NgtsEnvironmentInputState['blur']) {
        this.set({ blur });
    }

    @Input() set map(map: NgtsEnvironmentInputState['map']) {
        this.set({ map });
    }

    @Input() set files(files: NgtsEnvironmentInputState['files']) {
        this.set({ files });
    }

    @Input() set path(path: NgtsEnvironmentInputState['path']) {
        this.set({ path });
    }

    @Input() set preset(preset: NgtsEnvironmentInputState['preset']) {
        this.set({ preset });
    }

    @Input() set scene(scene: NgtsEnvironmentInputState['scene']) {
        this.set({ scene });
    }

    @Input() set extensions(extensions: NgtsEnvironmentInputState['extensions']) {
        this.set({ extensions });
    }

    @Input() set ground(ground: NgtsEnvironmentInputState['ground']) {
        this.set({ ground });
    }

    @Input() set encoding(encoding: NgtsEnvironmentInputState['encoding']) {
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
