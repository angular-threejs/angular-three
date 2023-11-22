import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output } from '@angular/core';
import { extend, signalStore, type NgtThreeEvent } from 'angular-three-old';
import { AmbientLight, Group, PointLight } from 'three';
import { injectNgtsGizmoHelperApi } from '../gizmo-helper';
import { NgtsGizmoViewportAxis, NgtsGizmoViewportAxisHead } from './gizmo-viewport-axis';

extend({ Group, AmbientLight, PointLight });

@Component({
	selector: 'ngts-gizmo-viewport',
	standalone: true,
	template: `
		<ngt-group ngtCompound [scale]="40">
			<ngts-gizmo-viewport-axis [color]="axisColors()[0]" [rotation]="[0, 0, 0]" [scale]="axisScale()" />
			<ngts-gizmo-viewport-axis
				[color]="axisColors()[1]"
				[rotation]="[0, 0, Math.PI / 2]"
				[scale]="axisScale()"
			/>
			<ngts-gizmo-viewport-axis
				[color]="axisColors()[2]"
				[rotation]="[0, -Math.PI / 2, 0]"
				[scale]="axisScale()"
			/>
			<ng-container *ngIf="!hideAxisHeads()">
				<ngts-gizmo-viewport-axis-head
					[arcStyle]="axisColors()[0]"
					[position]="[1, 0, 0]"
					[label]="labels()[0]"
					[font]="font()"
					[disabled]="disabled()"
					[labelColor]="labelColor()"
					[viewportClickEmitter]="viewportClick"
					[axisHeadScale]="axisHeadScale()"
					(pointerdown)="onPointerDown($any($event))"
				/>
				<ngts-gizmo-viewport-axis-head
					[arcStyle]="axisColors()[1]"
					[position]="[0, 1, 0]"
					[label]="labels()[1]"
					[font]="font()"
					[disabled]="disabled()"
					[labelColor]="labelColor()"
					[viewportClickEmitter]="viewportClick"
					[axisHeadScale]="axisHeadScale()"
					(pointerdown)="onPointerDown($any($event))"
				/>
				<ngts-gizmo-viewport-axis-head
					[arcStyle]="axisColors()[2]"
					[position]="[0, 0, 1]"
					[label]="labels()[2]"
					[font]="font()"
					[disabled]="disabled()"
					[labelColor]="labelColor()"
					[viewportClickEmitter]="viewportClick"
					[axisHeadScale]="axisHeadScale()"
					(pointerdown)="onPointerDown($any($event))"
				/>
				<ng-container *ngIf="!hideNegativeAxes()">
					<ngts-gizmo-viewport-axis-head
						[arcStyle]="axisColors()[0]"
						[position]="[-1, 0, 0]"
						[font]="font()"
						[disabled]="disabled()"
						[labelColor]="labelColor()"
						[viewportClickEmitter]="viewportClick"
						[axisHeadScale]="axisHeadScale()"
						(pointerdown)="onPointerDown($any($event))"
					/>
					<ngts-gizmo-viewport-axis-head
						[arcStyle]="axisColors()[1]"
						[position]="[0, -1, 0]"
						[font]="font()"
						[disabled]="disabled()"
						[labelColor]="labelColor()"
						[viewportClickEmitter]="viewportClick"
						[axisHeadScale]="axisHeadScale()"
						(pointerdown)="onPointerDown($any($event))"
					/>
					<ngts-gizmo-viewport-axis-head
						[arcStyle]="axisColors()[2]"
						[position]="[0, 0, -1]"
						[font]="font()"
						[disabled]="disabled()"
						[labelColor]="labelColor()"
						[viewportClickEmitter]="viewportClick"
						[axisHeadScale]="axisHeadScale()"
						(pointerdown)="onPointerDown($any($event))"
					/>
				</ng-container>
			</ng-container>
			<ngt-ambient-light [intensity]="0.5"></ngt-ambient-light>
			<ngt-point-light [position]="10" [intensity]="0.5"></ngt-point-light>
		</ngt-group>
	`,
	imports: [NgtsGizmoViewportAxis, NgtsGizmoViewportAxisHead, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewport {
	private inputs = signalStore<{
		axisColors: [string, string, string];
		axisScale: [number, number, number];
		labels: [string, string, string];
		axisHeadScale: number;
		labelColor: string;
		hideNegativeAxes: boolean;
		hideAxisHeads: boolean;
		disabled: boolean;
		font: string;
	}>({
		font: '18px Inter var, Arial, sans-serif',
		axisColors: ['#ff2060', '#20df80', '#2080ff'],
		axisHeadScale: 1,
		labels: ['X', 'Y', 'Z'],
		labelColor: '#000',
	});
	private gizmoApi = injectNgtsGizmoHelperApi();

	Math = Math;

	@Input({ alias: 'axisColors' }) set _axisColors(axisColors: [string, string, string]) {
		this.inputs.set({ axisColors });
	}

	@Input({ alias: 'axisScale' }) set _axisScale(axisScale: [number, number, number]) {
		this.inputs.set({ axisScale });
	}

	@Input({ alias: 'labels' }) set _labels(labels: [string, string, string]) {
		this.inputs.set({ labels });
	}

	@Input({ alias: 'axisHeadScale' }) set _axisHeadScale(axisHeadScale: number) {
		this.inputs.set({ axisHeadScale });
	}

	@Input({ alias: 'labelColor' }) set _labelColor(labelColor: string) {
		this.inputs.set({ labelColor });
	}

	@Input({ alias: 'hideNegativeAxes' }) set _hideNegativeAxes(hideNegativeAxes: boolean) {
		this.inputs.set({ hideNegativeAxes });
	}

	@Input({ alias: 'hideAxisHeads' }) set _hideAxisHeads(hideAxisHeads: boolean) {
		this.inputs.set({ hideAxisHeads });
	}

	@Input({ alias: 'disabled' }) set _disabled(disabled: boolean) {
		this.inputs.set({ disabled });
	}

	@Input({ alias: 'font' }) set _font(font: string) {
		this.inputs.set({ font });
	}

	@Output() viewportClick = new EventEmitter<NgtThreeEvent<MouseEvent>>();

	axisColors = this.inputs.select('axisColors');
	axisScale = this.inputs.select('axisScale');
	labels = this.inputs.select('labels');
	axisHeadScale = this.inputs.select('axisHeadScale');
	labelColor = this.inputs.select('labelColor');
	hideNegativeAxes = this.inputs.select('hideNegativeAxes');
	hideAxisHeads = this.inputs.select('hideAxisHeads');
	disabled = this.inputs.select('disabled');
	font = this.inputs.select('font');

	onPointerDown(event: NgtThreeEvent<PointerEvent>) {
		if (!this.inputs.get('disabled')) {
			event.stopPropagation();
			this.gizmoApi.tweenCamera(event.object.position);
		}
	}
}
