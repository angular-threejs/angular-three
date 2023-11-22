import { DOCUMENT } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Input, signal } from '@angular/core';
import { extend, injectNgtStore, NgtArgs, signalStore, type NgtThreeEvent } from 'angular-three-old';
import { BoxGeometry, CanvasTexture, Group, Mesh, MeshBasicMaterial, Sprite, SpriteMaterial } from 'three';

extend({ Group, Mesh, BoxGeometry, MeshBasicMaterial, Sprite, SpriteMaterial });

@Component({
	selector: 'ngts-gizmo-viewport-axis',
	standalone: true,
	template: `
		<ngt-group [rotation]="rotation()">
			<ngt-mesh [position]="[0.4, 0, 0]">
				<ngt-box-geometry *args="scale()" />
				<ngt-mesh-basic-material [color]="color()" [toneMapped]="false" />
			</ngt-mesh>
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewportAxis {
	private inputs = signalStore<{
		color: string;
		rotation: [number, number, number];
		scale: [number, number, number];
	}>({ scale: [0.8, 0.05, 0.05] });

	@Input({ required: true, alias: 'color' }) set _color(color: string) {
		this.inputs.set({ color });
	}

	@Input({ required: true, alias: 'rotation' }) set _rotation(rotation: [number, number, number]) {
		this.inputs.set({ rotation });
	}

	@Input({ alias: 'scale' }) set _scale(scale: [number, number, number]) {
		this.inputs.set({ scale });
	}

	rotation = this.inputs.select('rotation');
	color = this.inputs.select('color');
	scale = this.inputs.select('scale');
}

@Component({
	selector: 'ngts-gizmo-viewport-axis-head',
	standalone: true,
	template: `
		<ngt-sprite
			ngtCompound
			[scale]="scale()"
			(pointerover)="onPointerOver($event)"
			(pointerout)="onPointerOut($event)"
		>
			<ngt-sprite-material
				[map]="texture()"
				[opacity]="label() ? 1 : 0.75"
				[alphaTest]="0.3"
				[toneMapped]="false"
			>
				<ngt-value [rawValue]="capabilities().getMaxAnisotropy() || 1" attach="map.anisotropy" />
			</ngt-sprite-material>
		</ngt-sprite>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewportAxisHead {
	private inputs = signalStore<{
		arcStyle: string;
		label: string;
		labelColor: string;
		axisHeadScale: number;
		disabled: boolean;
		font: string;
	}>({ axisHeadScale: 1 });

	private document = inject(DOCUMENT);
	private store = injectNgtStore();
	capabilities = this.store.select('gl', 'capabilities');

	@Input({ alias: 'arcStyle' }) set _arcStyle(arcStyle: string) {
		this.inputs.set({ arcStyle });
	}

	@Input({ alias: 'label' }) set _label(label: string) {
		this.inputs.set({ label });
	}

	@Input({ alias: 'labelColor' }) set _labelColor(labelColor: string) {
		this.inputs.set({ labelColor });
	}

	@Input({ alias: 'axisHeadScale' }) set _axisHeadScale(axisHeadScale: number) {
		this.inputs.set({ axisHeadScale });
	}

	@Input({ alias: 'disabled' }) set _disabled(disabled: boolean) {
		this.inputs.set({ disabled });
	}

	@Input({ alias: 'font' }) set _font(font: string) {
		this.inputs.set({ font });
	}

	@Input() viewportClickEmitter?: EventEmitter<NgtThreeEvent<MouseEvent>>;

	active = signal(false);

	private arcStyle = this.inputs.select('arcStyle');
	private labelColor = this.inputs.select('labelColor');
	private font = this.inputs.select('font');
	private axisHeadScale = this.inputs.select('axisHeadScale');

	label = this.inputs.select('label');

	texture = computed(() => {
		const [arcStyle, labelColor, font, label] = [this.arcStyle(), this.labelColor(), this.font(), this.label()];

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
		return new CanvasTexture(canvas);
	});

	scale = computed(() => {
		const [active, axisHeadScale, label] = [this.active(), this.axisHeadScale(), this.label()];
		return (label ? 1 : 0.75) * (active ? 1.2 : 1) * axisHeadScale;
	});

	onPointerOver(event: NgtThreeEvent<PointerEvent>) {
		if (!this.inputs.get('disabled')) {
			event.stopPropagation();
			this.active.set(true);
		}
	}

	onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		if (!this.inputs.get('disabled')) {
			if (this.viewportClickEmitter?.observed) {
				this.viewportClickEmitter.emit(event);
			} else {
				event.stopPropagation();
				this.active.set(false);
			}
		}
	}
}
