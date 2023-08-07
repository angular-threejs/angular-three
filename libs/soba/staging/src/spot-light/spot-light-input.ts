import { Directive, Input } from '@angular/core';
import { signalStore } from 'angular-three';

export type NgtsSpotLightInputState = {
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
};

@Directive()
export abstract class NgtsSpotLightInput {
	inputs = signalStore<NgtsSpotLightInputState>({});

	@Input({ alias: 'depthBuffer' }) set _depthBuffer(depthBuffer: THREE.DepthTexture) {
		this.inputs.set({ depthBuffer });
	}

	@Input({ alias: 'angle' }) set _angle(angle: number) {
		this.inputs.set({ angle });
	}

	@Input({ alias: 'distance' }) set _distance(distance: number) {
		this.inputs.set({ distance });
	}

	@Input({ alias: 'attenuation' }) set _attenuation(attenuation: number) {
		this.inputs.set({ attenuation });
	}

	@Input({ alias: 'anglePower' }) set _anglePower(anglePower: number) {
		this.inputs.set({ anglePower });
	}

	@Input({ alias: 'radiusTop' }) set _radiusTop(radiusTop: number) {
		this.inputs.set({ radiusTop });
	}

	@Input({ alias: 'radiusBottom' }) set _radiusBottom(radiusBottom: number) {
		this.inputs.set({ radiusBottom });
	}

	@Input({ alias: 'opacity' }) set _opacity(opacity: number) {
		this.inputs.set({ opacity });
	}

	@Input({ alias: 'color' }) set _color(color: string | number) {
		this.inputs.set({ color });
	}

	@Input({ alias: 'debug' }) set _debug(debug: boolean) {
		this.inputs.set({ debug });
	}

	debug = this.inputs.select('debug');
	color = this.inputs.select('color');
	opacity = this.inputs.select('opacity');
	radiusBottom = this.inputs.select('radiusBottom');
	radiusTop = this.inputs.select('radiusTop');
	anglePower = this.inputs.select('anglePower');
	attenuation = this.inputs.select('attenuation');
	distance = this.inputs.select('distance');
	angle = this.inputs.select('angle');
	depthBuffer = this.inputs.select('depthBuffer');
}
