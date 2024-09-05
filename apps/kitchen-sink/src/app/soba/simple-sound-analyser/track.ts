import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsText } from 'angular-three-soba/abstractions';
import { NgtsPivotControls } from 'angular-three-soba/controls';
import { InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry } from 'three';
import { AudioStore } from './audio.store';

@Component({
	selector: 'app-track',
	standalone: true,
	template: `
		<ngt-group [position]="position()">
			<ngt-instanced-mesh #instanced *args="[undefined, undefined, length()]" [castShadow]="true">
				<ngt-plane-geometry *args="[0.01, 0.05]" />
				<ngt-mesh-basic-material [toneMapped]="false" />
			</ngt-instanced-mesh>

			<ngts-text [text]="sound()" [options]="{ fontSize: 0.05, color: 'black', position: [0.375, 0, 0] }" />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsText, NgtsPivotControls],
})
export class Track {
	sound = input.required<'drums' | 'synth' | 'snare'>();
	position = input<[number, number, number]>([0, 0, 0]);

	private instancedRef = viewChild<ElementRef<InstancedMesh<PlaneGeometry, MeshBasicMaterial>>>('instanced');

	private audioStore = inject(AudioStore);

	audio = computed(() => this.audioStore[this.sound()]());
	protected length = computed(() => {
		return this.audio()?.data.length;
	});

	constructor() {
		effect((onCleanup) => {
			const audio = this.audio();
			if (!audio) return;
			const { gainNode, audioContext } = audio;
			gainNode.connect(audioContext.destination);
			onCleanup(() => gainNode.disconnect());
		});

		const dummy = new Object3D();
		injectBeforeRender(() => {
			const instanced = this.instancedRef()?.nativeElement;
			if (!instanced) return;

			const audio = this.audio();
			if (!audio) return;

			const { data } = audio;
			const avg = audio.update();

			// Distribute the instanced planes according to the frequency data
			for (let i = 0; i < data.length; i++) {
				dummy.position.set(i * 0.01 * 1.8 - (data.length * 0.01 * 1.8) / 2, data[i] / 2500, 0);
				dummy.updateMatrix();
				instanced.setMatrixAt(i, dummy.matrix);
			}
			// Set the hue according to the frequency average
			instanced.material.color.setHSL(avg / 500, 0.75, 0.75);
			instanced.instanceMatrix.needsUpdate = true;
		});
	}
}
