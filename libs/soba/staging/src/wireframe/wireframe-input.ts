import { Directive, Input, computed } from '@angular/core';
import { is, signalStore, type NgtRef } from 'angular-three';
import type { WireframeMaterialState } from 'angular-three-soba/shaders';
import * as THREE from 'three';

export type NgtsWireframeState = {
	geometry?: NgtRef<THREE.BufferGeometry>;
	simplify: boolean;
} & Required<WireframeMaterialState>;

@Directive()
export abstract class NgtsWireframeInput {
	inputs = signalStore<NgtsWireframeState>({
		simplify: false,
		strokeOpacity: 1,
		fillOpacity: 0.25,
		fillMix: 0,
		thickness: 0.05,
		colorBackfaces: false,
		dashInvert: true,
		dash: false,
		dashRepeats: 4,
		dashLength: 0.5,
		squeeze: false,
		squeezeMin: 0.2,
		squeezeMax: 1,
		stroke: new THREE.Color('#ff0000'),
		backfaceStroke: new THREE.Color('#0000ff'),
		fill: new THREE.Color('#00ff00'),
	});

	@Input({ alias: 'geometry' }) set _geometry(geometry: NgtRef<THREE.BufferGeometry>) {
		this.inputs.set({ geometry });
	}

	@Input({ alias: 'simplify' }) set _simplify(simplify: boolean) {
		this.inputs.set({ simplify });
	}

	@Input({ alias: 'fillOpacity' }) set _fillOpacity(fillOpacity: number) {
		this.inputs.set({ fillOpacity });
	}

	@Input({ alias: 'fillMix' }) set _fillMix(fillMix: number) {
		this.inputs.set({ fillMix });
	}

	@Input({ alias: 'strokeOpacity' }) set _strokeOpacity(strokeOpacity: number) {
		this.inputs.set({ strokeOpacity });
	}

	@Input({ alias: 'thickness' }) set _thickness(thickness: number) {
		this.inputs.set({ thickness });
	}

	@Input({ alias: 'colorBackfaces' }) set _colorBackfaces(colorBackfaces: boolean) {
		this.inputs.set({ colorBackfaces });
	}

	@Input({ alias: 'dashInvert' }) set _dashInvert(dashInvert: boolean) {
		this.inputs.set({ dashInvert });
	}

	@Input({ alias: 'dash' }) set _dash(dash: boolean) {
		this.inputs.set({ dash });
	}

	@Input({ alias: 'dashRepeats' }) set _dashRepeats(dashRepeats: number) {
		this.inputs.set({ dashRepeats });
	}

	@Input({ alias: 'dashLength' }) set _dashLength(dashLength: number) {
		this.inputs.set({ dashLength });
	}

	@Input({ alias: 'squeeze' }) set _squeeze(squeeze: boolean) {
		this.inputs.set({ squeeze });
	}

	@Input({ alias: 'squeezeMin' }) set _squeezeMin(squeezeMin: number) {
		this.inputs.set({ squeezeMin });
	}

	@Input({ alias: 'squeezeMax' }) set _squeezeMax(squeezeMax: number) {
		this.inputs.set({ squeezeMax });
	}

	@Input({ alias: 'stroke' }) set _stroke(stroke: THREE.ColorRepresentation) {
		this.inputs.set({ stroke });
	}

	@Input({ alias: 'backfaceStroke' }) set _backfaceStroke(backfaceStroke: THREE.ColorRepresentation) {
		this.inputs.set({ backfaceStroke });
	}

	@Input({ alias: 'fill' }) set _fill(fill: THREE.ColorRepresentation) {
		this.inputs.set({ fill });
	}

	simplify = this.inputs.select('simplify');
	geometry = this.inputs.select('geometry');
	customGeometry = computed(() => {
		const geometry = this.geometry();
		return is.ref(geometry) ? geometry.nativeElement : geometry;
	});

	strokeOpacity = this.inputs.select('strokeOpacity');
	fillOpacity = this.inputs.select('fillOpacity');
	fillMix = this.inputs.select('fillMix');
	thickness = this.inputs.select('thickness');
	colorBackfaces = this.inputs.select('colorBackfaces');
	dashInvert = this.inputs.select('dashInvert');
	dash = this.inputs.select('dash');
	dashRepeats = this.inputs.select('dashRepeats');
	dashLength = this.inputs.select('dashLength');
	squeeze = this.inputs.select('squeeze');
	squeezeMin = this.inputs.select('squeezeMin');
	squeezeMax = this.inputs.select('squeezeMax');
	stroke = this.inputs.select('stroke');
	backfaceStroke = this.inputs.select('backfaceStroke');
	fill = this.inputs.select('fill');

	materialState = computed(() => {
		const [
			strokeOpacity,
			fillOpacity,
			fillMix,
			thickness,
			colorBackfaces,
			dashInvert,
			dash,
			dashRepeats,
			dashLength,
			squeeze,
			squeezeMin,
			squeezeMax,
			stroke,
			backfaceStroke,
			fill,
		] = [
			this.strokeOpacity(),
			this.fillOpacity(),
			this.fillMix(),
			this.thickness(),
			this.colorBackfaces(),
			this.dashInvert(),
			this.dash(),
			this.dashRepeats(),
			this.dashLength(),
			this.squeeze(),
			this.squeezeMin(),
			this.squeezeMax(),
			this.stroke(),
			this.backfaceStroke(),
			this.fill(),
		];
		return {
			strokeOpacity,
			fillOpacity,
			fillMix,
			thickness,
			colorBackfaces,
			dashInvert,
			dash,
			dashRepeats,
			dashLength,
			squeeze,
			squeezeMin,
			squeezeMax,
			stroke,
			backfaceStroke,
			fill,
		};
	});
}
