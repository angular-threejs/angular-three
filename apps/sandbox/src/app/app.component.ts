import { NgIf } from '@angular/common';
import { Component, Type, ViewChild, ViewContainerRef, computed, effect, signal } from '@angular/core';
import { extend } from 'angular-three';
import { NgtsLoader } from 'angular-three-soba/loaders';
import * as THREE from 'three';
import { AviatorCanvas } from './aviator/canvas.component';
import { BotCanvas } from './bot/canvas.component';
import { CannonCanvas } from './cannon/canvas.component';
import { SkyDivingCanvas } from './skydiving/canvas.component';
import { gravity, isDebugging } from './states';
import { VaporwareCanvas } from './vaporware/canvas.component';

extend(THREE);

const canvases = {
	bot: BotCanvas,
	skydiving: SkyDivingCanvas,
	vaporware: VaporwareCanvas,
	aviator: AviatorCanvas,
	cannon: CannonCanvas,
} as const;

const availableCanvases = Object.keys(canvases) as [keyof typeof canvases];
type AvailableCanvas = (typeof availableCanvases)[number];

@Component({
	standalone: true,
	imports: [NgtsLoader, NgIf],
	selector: 'sandbox-root',
	template: `
		<ng-container #anchor />
		<ngts-loader />
		<button class="cycle" (click)="cycleCanvas()">Current canvas: {{ canvas() }}</button>
		<ng-container *ngIf="showDebugging()">
			<button class="cycle" style="left: 12rem" (click)="isDebugging.toggle()">
				Is debugging? {{ isDebugging.isDebugging() }}
			</button>
			<button class="cycle" style="left: 22rem" (click)="gravity.change()">
				{{ gravity.btnText() }}
			</button>
		</ng-container>
	`,
	host: {
		'[style.--background]': 'background',
		style: 'background: var(--background); display: block; height: 100%; width: 100%',
	},
})
export class AppComponent {
	canvas = signal<AvailableCanvas>('cannon');
	isDebugging = isDebugging;
	gravity = gravity;
	showDebugging = computed(() => this.canvas() === 'cannon');

	@ViewChild('anchor', { static: true, read: ViewContainerRef }) vcr!: ViewContainerRef;

	constructor() {
		effect((onCleanup) => {
			const ref = this.vcr.createComponent(canvases[this.canvas()] as Type<unknown>);
			onCleanup(ref.destroy.bind(ref));
		});
	}

	cycleCanvas() {
		const index = availableCanvases.indexOf(this.canvas());
		this.canvas.set(availableCanvases[(index + 1) % availableCanvases.length]);
	}

	get background() {
		if (this.canvas() === 'skydiving') return '#272727';
		if (this.canvas() === 'vaporware') return 'black';
		if (this.canvas() === 'aviator') return 'linear-gradient(#101232, #101560)';
		return 'white';
	}
}
