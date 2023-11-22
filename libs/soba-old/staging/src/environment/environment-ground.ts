import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { extend, NgtArgs } from 'angular-three-old';
import { GroundProjectedEnv } from 'three-stdlib';
import { NgtsEnvironmentInput } from './environment-input';
import { NgtsEnvironmentMap } from './environment-map';
import { injectNgtsEnvironment } from './utils';

extend({ GroundProjectedEnv });

@Component({
	selector: 'ngts-environment-ground',
	standalone: true,
	template: `
		<ngts-environment-map [map]="texture()" [background]="!!environmentInput.background()" />
		<ngt-ground-projected-env *args="groundArgs()" [scale]="scale()" [height]="height()" [radius]="radius()" />
	`,
	imports: [NgtsEnvironmentMap, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEnvironmentGround {
	environmentInput = inject(NgtsEnvironmentInput);
	private defaultTexture = injectNgtsEnvironment(this.environmentInput.params);

	texture = computed(() => {
		const defaultTexture = this.defaultTexture.nativeElement;
		return this.environmentInput.map() || defaultTexture;
	});

	groundArgs = computed(() => (this.texture() ? [this.texture()] : []));
	height = computed(() => (this.environmentInput.ground() as any)?.height);
	radius = computed(() => (this.environmentInput.ground() as any)?.radius);
	scale = computed(() => (this.environmentInput.ground() as any)?.scale ?? 1000);
}
