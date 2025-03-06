import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	inject,
	signal,
} from '@angular/core';
import { NgtArgs, signalState } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsContactShadows, NgtsEnvironment, NgtsFloat } from 'angular-three-soba/staging';

import shoeGLB from './shoe-draco.glb' with { loader: 'file' };

injectGLTF.preload(() => shoeGLB);

const state = signalState({
	current: null as string | null,
	items: {
		laces: '#ffffff',
		mesh: '#ffffff',
		caps: '#ffffff',
		inner: '#ffffff',
		sole: '#ffffff',
		stripes: '#ffffff',
		band: '#ffffff',
		patch: '#ffffff',
	},
});

@Component({
	selector: 'app-color-picker',
	template: `
		@let current = state.current();
		<div class="absolute top-12 left-1/2 -translate-x-1/2" [class]="{ block: !!current, hidden: !current }">
			@if (current) {
				@let value = $any(state.items)[current]();
				<input type="color" [value]="value" (input)="onChange($event, current)" />
				<h1 class="text-xl font-bold font-mono">{{ current }}</h1>
			}
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPicker {
	protected readonly state = state;

	protected onChange(event: Event, current: string) {
		const target = event.target as HTMLInputElement;
		this.state.update((state) => ({ items: { ...state.items, [current]: target.value } }));
	}
}

@Component({
	selector: 'app-shoe',
	template: `
		<ngts-float>
			<ngt-group
				(pointerover)="$event.stopPropagation(); hovered.set($any($event.object).material.name)"
				(pointerout)="$event.intersections.length === 0 && hovered.set(null)"
				(pointermissed)="state.update({ current: null })"
				(click)="$event.stopPropagation(); state.update({ current: $any($event.object).material.name })"
			>
				@if (gltf(); as gltf) {
					<ng-template #m let-ctx="ctx">
						@let geometry = gltf.meshes[ctx[0]].geometry;
						@let material = gltf.materials[ctx[1]];
						<ngt-mesh receiveShadow castShadow [geometry]="geometry" [material]="material">
							<ngt-value [rawValue]="$any(state.items)[ctx[1]]()" attach="material.color" />
						</ngt-mesh>
					</ng-template>

					<ng-container [ngTemplateOutlet]="m" [ngTemplateOutletContext]="{ ctx: ['shoe', 'laces'] }" />
					<ng-container [ngTemplateOutlet]="m" [ngTemplateOutletContext]="{ ctx: ['shoe_1', 'mesh'] }" />
					<ng-container [ngTemplateOutlet]="m" [ngTemplateOutletContext]="{ ctx: ['shoe_2', 'caps'] }" />
					<ng-container [ngTemplateOutlet]="m" [ngTemplateOutletContext]="{ ctx: ['shoe_3', 'inner'] }" />
					<ng-container [ngTemplateOutlet]="m" [ngTemplateOutletContext]="{ ctx: ['shoe_4', 'sole'] }" />
					<ng-container [ngTemplateOutlet]="m" [ngTemplateOutletContext]="{ ctx: ['shoe_5', 'stripes'] }" />
					<ng-container [ngTemplateOutlet]="m" [ngTemplateOutletContext]="{ ctx: ['shoe_6', 'band'] }" />
					<ng-container [ngTemplateOutlet]="m" [ngTemplateOutletContext]="{ ctx: ['shoe_7', 'patch'] }" />
				}
			</ngt-group>
		</ngts-float>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsFloat, NgTemplateOutlet],
})
export class Shoe {
	protected readonly state = state;

	private document = inject(DOCUMENT);
	protected gltf = injectGLTF(() => shoeGLB);

	protected hovered = signal<string | null>(null);

	private cursor = computed(() => {
		const hovered = this.hovered();
		if (hovered) {
			return btoa(
				`<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><g filter="url(#filter0_d)"><path d="M29.5 47C39.165 47 47 39.165 47 29.5S39.165 12 29.5 12 12 19.835 12 29.5 19.835 47 29.5 47z" fill="${state.snapshot.items[hovered as keyof typeof state.snapshot.items]}"/></g><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/><text fill="#000" style="#fff-space:pre" font-family="Inter var, sans-serif" font-size="10" letter-spacing="-.01em"><tspan x="35" y="63">${hovered}</tspan></text></g><defs><clipPath id="clip0"><path fill="#fff" d="M0 0h64v64H0z"/></clipPath><filter id="filter0_d" x="6" y="8" width="47" height="47" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dy="2"/><feGaussianBlur stdDeviation="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter></defs></svg>`,
			);
		}
		return btoa(
			`<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/></svg>`,
		);
	});

	constructor() {
		effect((onCleanup) => {
			this.document.body.style.cursor = `url('data:image/svg+xml;base64,${this.cursor()}'), auto`;
			onCleanup(() => (this.document.body.style.cursor = 'auto'));
		});
	}
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color *args="['#c0c0c0']" attach="background" />

		<ngt-ambient-light [intensity]="Math.PI * 0.7" />
		<ngt-spot-light
			[decay]="0"
			[intensity]="Math.PI * 0.5"
			[angle]="0.1"
			[penumbra]="1"
			[position]="[10, 15, 10]"
			castShadow
		/>
		<app-shoe />
		<ngts-environment [options]="{ preset: 'city' }" />
		<ngts-contact-shadows [options]="{ position: [0, -0.8, 0], opacity: 0.25, scale: 10, blur: 1.5, far: 0.8 }" />
		<ngts-orbit-controls
			[options]="{ enableZoom: false, enablePan: false, minPolarAngle: Math.PI / 2, maxPolarAngle: Math.PI / 2 }"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Shoe, NgtsEnvironment, NgtsContactShadows, NgtsOrbitControls, NgtArgs],
})
export class SceneGraph {
	protected readonly Math = Math;
}
