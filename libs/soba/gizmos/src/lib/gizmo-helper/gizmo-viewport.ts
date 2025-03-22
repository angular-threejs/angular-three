import { DOCUMENT } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	output,
	signal,
	viewChild,
} from '@angular/core';
import {
	extend,
	getEmitter,
	hasListener,
	injectStore,
	NgtArgs,
	NgtEuler,
	NgtEventHandlers,
	NgtThreeElements,
	NgtThreeEvent,
	NgtVector3,
	objectEvents,
	omit,
	pick,
} from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Sprite, SpriteMaterial } from 'three';
import { NgtsGizmoHelperImpl } from './gizmo-helper';

@Component({
	selector: 'viewport-axis',
	template: `
		<ngt-group [rotation]="rotation()">
			<ngt-mesh [position]="[0.4, 0, 0]">
				<ngt-box-geometry *args="scale()" />
				<ngt-mesh-basic-material [color]="color()" [toneMapped]="false" />
			</ngt-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Axis {
	scale = input([0.8, 0.05, 0.05], {
		transform: (value: [number, number, number] | undefined) => {
			if (value === undefined) return [0.8, 0.05, 0.05];
			return value;
		},
	});
	color = input<THREE.ColorRepresentation>();
	rotation = input<NgtEuler>([0, 0, 0]);

	constructor() {
		extend({ Group, Mesh, BoxGeometry, MeshBasicMaterial });
	}
}

@Component({
	selector: 'viewport-axis-head',
	template: `
		<ngt-sprite #sprite [scale]="scale()" [position]="position()">
			<ngt-sprite-material
				[map]="texture()"
				[alphaTest]="0.3"
				[opacity]="label() ? 1 : 0.75"
				[toneMapped]="false"
			/>
		</ngt-sprite>
	`,

	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AxisHead {
	arcStyle = input.required<string>();
	position = input.required<NgtVector3>();
	label = input<string>();
	labelColor = input('#000');
	axisHeadScale = input(1);
	disabled = input(false);
	font = input('18px Inter var, Arial, sans-serif');
	onClick = input<NgtEventHandlers['click']>();

	private spriteRef = viewChild.required<ElementRef<THREE.Sprite>>('sprite');

	private document = inject(DOCUMENT);
	private gizmoHelper = inject(NgtsGizmoHelperImpl);
	private store = injectStore();

	protected texture = computed(() => {
		const [arcStyle, label, labelColor, font, gl] = [
			this.arcStyle(),
			this.label(),
			this.labelColor(),
			this.font(),
			this.store.gl(),
		];

		const canvas = this.document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;

		const context = canvas.getContext('2d')!;
		context.beginPath();
		context.arc(32, 32, 16, 0, 2 * Math.PI);
		context.closePath();
		context.fillStyle = arcStyle;
		context.fill();

		if (label) {
			context.font = font;
			context.textAlign = 'center';
			context.fillStyle = labelColor;
			context.fillText(label, 32, 41);
		}

		const texture = new THREE.CanvasTexture(canvas);
		texture.anisotropy = gl.capabilities.getMaxAnisotropy() || 1;
		return texture;
	});

	protected active = signal(false);
	protected scale = computed(() => (this.label() ? 1 : 0.75) * (this.active() ? 1.2 : 1) * this.axisHeadScale());

	constructor() {
		extend({ Sprite, SpriteMaterial });

		// TODO: (chau) remove this when event binding syntax no longer trigger cdr
		objectEvents(this.spriteRef, {
			pointerover: this.onPointerOver.bind(this),
			pointerout: this.onPointerOut.bind(this),
			pointerdown: this.onPointerDown.bind(this),
		});
	}

	protected onPointerOver(event: NgtThreeEvent<PointerEvent>) {
		if (this.disabled()) return;

		event.stopPropagation();
		this.active.set(true);
	}

	protected onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		if (this.disabled()) return;

		const onClick = this.onClick();
		if (onClick) onClick(event);
		else {
			event.stopPropagation();
			this.active.set(false);
		}
	}

	protected onPointerDown(event: NgtThreeEvent<PointerEvent>) {
		if (this.disabled()) return;
		event.stopPropagation();
		this.gizmoHelper.tweenCamera(event.object.position);
	}
}

export interface NgtsGizmoViewportOptions extends Partial<NgtThreeElements['ngt-group']> {
	axisColors: [string, string, string];
	axisScale?: [number, number, number];
	labels: [string, string, string];
	axisHeadScale: number;
	labelColor: string;
	hideNegativeAxes: boolean;
	hideAxisHeads: boolean;
	disabled: boolean;
	font: string;
}

const defaultOptions: NgtsGizmoViewportOptions = {
	axisColors: ['#ff2060', '#20df80', '#2080ff'],
	labels: ['X', 'Y', 'Z'],
	axisHeadScale: 1,
	labelColor: '#000',
	hideNegativeAxes: false,
	hideAxisHeads: false,
	disabled: false,
	font: '18px Inter var, Arial, sans-serif',
};

@Component({
	selector: 'ngts-gizmo-viewport',
	template: `
		@let _axisScale = axisScale();
		@let _axisHeadScale = axisHeadScale();
		@let _labels = labels();
		@let _labelColor = labelColor();
		@let _axisColors = axisColors();
		@let _font = font();
		@let _disabled = disabled();

		<ngt-group [scale]="40" [parameters]="parameters()">
			<viewport-axis [color]="_axisColors[0]" [rotation]="[0, 0, 0]" [scale]="_axisScale" />
			<viewport-axis [color]="_axisColors[1]" [rotation]="[0, 0, Math.PI / 2]" [scale]="_axisScale" />
			<viewport-axis [color]="_axisColors[2]" [rotation]="[0, -Math.PI / 2, 0]" [scale]="_axisScale" />

			@if (!hideAxisHeads()) {
				<viewport-axis-head
					[arcStyle]="_axisColors[0]"
					[position]="[1, 0, 0]"
					[label]="_labels[0]"
					[labelColor]="_labelColor"
					[axisHeadScale]="_axisHeadScale"
					[disabled]="_disabled"
					[font]="_font"
					[onClick]="onClick"
				/>
				<viewport-axis-head
					[arcStyle]="_axisColors[1]"
					[position]="[0, 1, 0]"
					[label]="_labels[1]"
					[labelColor]="_labelColor"
					[axisHeadScale]="_axisHeadScale"
					[disabled]="_disabled"
					[font]="_font"
					[onClick]="onClick"
				/>
				<viewport-axis-head
					[arcStyle]="_axisColors[2]"
					[position]="[0, 0, 1]"
					[label]="_labels[2]"
					[labelColor]="_labelColor"
					[axisHeadScale]="_axisHeadScale"
					[disabled]="_disabled"
					[font]="_font"
					[onClick]="onClick"
				/>

				@if (!hideNegativeAxes()) {
					<viewport-axis-head
						[arcStyle]="_axisColors[0]"
						[position]="[-1, 0, 0]"
						[axisHeadScale]="_axisHeadScale"
						[disabled]="_disabled"
						[onClick]="onClick"
					/>
					<viewport-axis-head
						[arcStyle]="_axisColors[1]"
						[position]="[0, -1, 0]"
						[axisHeadScale]="_axisHeadScale"
						[disabled]="_disabled"
						[onClick]="onClick"
					/>
					<viewport-axis-head
						[arcStyle]="_axisColors[2]"
						[position]="[0, 0, -1]"
						[axisHeadScale]="_axisHeadScale"
						[disabled]="_disabled"
						[onClick]="onClick"
					/>
				}
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Axis, AxisHead],
})
export class NgtsGizmoViewport {
	protected readonly Math = Math;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'axisColors',
		'axisScale',
		'labels',
		'axisHeadScale',
		'labelColor',
		'hideNegativeAxes',
		'hideAxisHeads',
		'disabled',
		'font',
	]);
	click = output<NgtThreeEvent<MouseEvent>>();

	protected axisColors = pick(this.options, 'axisColors');
	protected axisScale = pick(this.options, 'axisScale');
	protected hideAxisHeads = pick(this.options, 'hideAxisHeads');
	protected hideNegativeAxes = pick(this.options, 'hideNegativeAxes');
	protected labels = pick(this.options, 'labels');
	protected axisHeadScale = pick(this.options, 'axisHeadScale');
	protected labelColor = pick(this.options, 'labelColor');
	protected disabled = pick(this.options, 'disabled');
	protected font = pick(this.options, 'font');

	constructor() {
		extend({ Group });
	}

	protected get onClick() {
		if (hasListener(this.click)) return getEmitter(this.click);
		return undefined;
	}
}
