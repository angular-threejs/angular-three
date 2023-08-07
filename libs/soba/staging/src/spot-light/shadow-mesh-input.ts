import { Directive, Input } from '@angular/core';
import { signalStore } from 'angular-three';

export type NgtsSpotLightShadowMeshInputState = {
	distance: number;
	alphaTest: number;
	scale: number;
	map: THREE.Texture;
	shader: string;
	width: number;
	height: number;
};

@Directive()
export abstract class NgtsSpotLightShadowMeshInput {
	inputs = signalStore<NgtsSpotLightShadowMeshInputState>({});

	@Input({ alias: 'distance' }) set _distance(distance: number) {
		this.inputs.set({ distance });
	}

	@Input({ alias: 'alphaTest' }) set _alphaTest(alphaTest: number) {
		this.inputs.set({ alphaTest });
	}

	@Input({ alias: 'scale' }) set _scale(scale: number) {
		this.inputs.set({ scale });
	}

	@Input({ alias: 'map' }) set _map(map: THREE.Texture) {
		this.inputs.set({ map });
	}

	@Input({ alias: 'shader' }) set _shader(shader: string) {
		this.inputs.set({ shader });
	}

	@Input({ alias: 'width' }) set _width(width: number) {
		this.inputs.set({ width });
	}

	@Input({ alias: 'height' }) set _height(height: number) {
		this.inputs.set({ height });
	}

	distance = this.inputs.select('distance');
	alphaTest = this.inputs.select('alphaTest');
	scale = this.inputs.select('scale');
	map = this.inputs.select('map');
	shader = this.inputs.select('shader');
	width = this.inputs.select('width');
	height = this.inputs.select('height');
}
