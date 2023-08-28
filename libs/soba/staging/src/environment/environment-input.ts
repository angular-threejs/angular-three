import { Directive, ElementRef, Input, computed } from '@angular/core';
import { signalStore } from 'angular-three';
import type { Loader, Scene, Texture, TextureEncoding } from 'three';
import type { NgtsEnvironmentPresetsType } from './assets';

export type NgtsEnvironmentInputState = {
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
};

@Directive()
export abstract class NgtsEnvironmentInput {
	inputs = signalStore<NgtsEnvironmentInputState>({});

	@Input({ alias: 'frames' }) set _frames(frames: NgtsEnvironmentInputState['frames']) {
		this.inputs.set({ frames });
	}

	@Input({ alias: 'near' }) set _near(near: NgtsEnvironmentInputState['near']) {
		this.inputs.set({ near });
	}

	@Input({ alias: 'far' }) set _far(far: NgtsEnvironmentInputState['far']) {
		this.inputs.set({ far });
	}

	@Input({ alias: 'resolution' }) set _resolution(resolution: NgtsEnvironmentInputState['resolution']) {
		this.inputs.set({ resolution });
	}

	@Input({ alias: 'background' }) set _background(background: NgtsEnvironmentInputState['background']) {
		this.inputs.set({ background });
	}

	@Input({ alias: 'blur' }) set _blur(blur: NgtsEnvironmentInputState['blur']) {
		this.inputs.set({ blur });
	}

	@Input({ alias: 'map' }) set _map(map: NgtsEnvironmentInputState['map']) {
		this.inputs.set({ map });
	}

	@Input({ alias: 'files' }) set _files(files: NgtsEnvironmentInputState['files']) {
		this.inputs.set({ files });
	}

	@Input({ alias: 'path' }) set _path(path: NgtsEnvironmentInputState['path']) {
		this.inputs.set({ path });
	}

	@Input({ alias: 'preset' }) set _preset(preset: NgtsEnvironmentInputState['preset']) {
		this.inputs.set({ preset });
	}

	@Input({ alias: 'scene' }) set _scene(scene: NgtsEnvironmentInputState['scene']) {
		this.inputs.set({ scene });
	}

	@Input({ alias: 'extensions' }) set _extensions(extensions: NgtsEnvironmentInputState['extensions']) {
		this.inputs.set({ extensions });
	}

	@Input({ alias: 'ground' }) set _ground(ground: NgtsEnvironmentInputState['ground']) {
		this.inputs.set({ ground });
	}

	@Input({ alias: 'encoding' }) set _encoding(encoding: NgtsEnvironmentInputState['encoding']) {
		this.inputs.set({ encoding });
	}

	frames = this.inputs.select('frames');
	near = this.inputs.select('near');
	far = this.inputs.select('far');
	resolution = this.inputs.select('resolution');
	background = this.inputs.select('background');
	blur = this.inputs.select('blur');
	map = this.inputs.select('map');
	files = this.inputs.select('files');
	path = this.inputs.select('path');
	preset = this.inputs.select('preset');
	scene = this.inputs.select('scene');
	extensions = this.inputs.select('extensions');
	ground = this.inputs.select('ground');
	encoding = this.inputs.select('encoding');

	params = computed(() => ({
		files: this.files(),
		path: this.path(),
		preset: this.preset(),
		extensions: this.extensions(),
		encoding: this.encoding(),
	}));
}
