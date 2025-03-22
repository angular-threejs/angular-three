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
	NgtEventHandlers,
	NgtThreeEvent,
	objectEvents,
	pick,
} from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { NgtsGizmoHelperImpl } from './gizmo-helper';

type XYZ = [number, number, number];

const colors = { bg: '#f0f0f0', hover: '#999', text: 'black', stroke: 'black' };
const defaultFaces = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'];

export interface NgtsViewcubeCommonOptions {
	font: string;
	opacity: number;
	color: string;
	hoverColor: string;
	textColor: string;
	strokeColor: string;
	faces: string[];
}

const defaultFaceMaterialOptions: NgtsViewcubeCommonOptions = {
	font: '20px Inter var, Arial, sans-serif',
	faces: defaultFaces,
	color: colors.bg,
	hoverColor: colors.hover,
	textColor: colors.text,
	strokeColor: colors.stroke,
	opacity: 1,
};

@Component({
	selector: 'viewcube-face-material',
	template: `
		<ngt-mesh-basic-material
			[attach]="['material', index()]"
			[map]="texture()"
			[color]="materialColor()"
			transparent
			[opacity]="opacity()"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaceMaterial {
	hover = input.required<boolean>();
	index = input.required<number>();
	options = input(defaultFaceMaterialOptions, { transform: mergeInputs(defaultFaceMaterialOptions) });

	private faces = pick(this.options, 'faces');
	private font = pick(this.options, 'font');
	private color = pick(this.options, 'color');
	private textColor = pick(this.options, 'textColor');
	private strokeColor = pick(this.options, 'strokeColor');
	private hoverColor = pick(this.options, 'hoverColor');

	private document = inject(DOCUMENT);
	private store = injectStore();

	protected opacity = pick(this.options, 'opacity');
	protected materialColor = computed(() => (this.hover() ? this.hoverColor() : 'white'));
	protected texture = computed(() => {
		const [index, faces, font, color, textColor, strokeColor, gl] = [
			this.index(),
			this.faces(),
			this.font(),
			this.color(),
			this.textColor(),
			this.strokeColor(),
			this.store.gl(),
		];

		const canvas = this.document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;

		const context = canvas.getContext('2d')!;
		context.fillStyle = color;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.strokeStyle = strokeColor;
		context.strokeRect(0, 0, canvas.width, canvas.height);
		context.font = font;
		context.textAlign = 'center';
		context.fillStyle = textColor;
		context.fillText(faces[index].toUpperCase(), 64, 76);

		const texture = new THREE.CanvasTexture(canvas);
		texture.anisotropy = gl.capabilities.getMaxAnisotropy() || 1;

		return texture;
	});

	constructor() {
		extend({ MeshBasicMaterial });
	}
}

@Component({
	selector: 'viewcube-face-cube',
	template: `
		<ngt-mesh #mesh (click)="internalOnClick($any($event))">
			<ngt-box-geometry />
			@for (face of count; track $index) {
				<viewcube-face-material [index]="$index" [hover]="hover() === $index" [options]="options()" />
			}
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FaceMaterial],
})
export class FaceCube {
	options = input({} as Partial<NgtsViewcubeCommonOptions>);
	onClick = input<NgtEventHandlers['click']>();

	private meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	private gizmoHelper = inject(NgtsGizmoHelperImpl);

	protected hover = signal(-1);
	protected count = Array.from({ length: 6 });

	constructor() {
		extend({ Mesh, BoxGeometry });

		// TODO: (chau) remove this when event binding syntax no longer trigger cdr
		objectEvents(this.meshRef, {
			pointerout: (ev) => {
				ev.stopPropagation();
				this.hover.set(-1);
			},
			pointermove: (ev) => {
				ev.stopPropagation();
				ev.faceIndex != null && this.hover.set(Math.floor(ev.faceIndex / 2));
			},
		});
	}

	protected internalOnClick(event: NgtThreeEvent<MouseEvent>) {
		const onClick = this.onClick();
		if (onClick) onClick(event);
		else {
			event.stopPropagation();
			this.gizmoHelper.tweenCamera(event.face!.normal);
		}
	}

	protected readonly Math = Math;
}

@Component({
	selector: 'viewcube-edge-cube',
	template: `
		<ngt-mesh #mesh [scale]="1.01" [position]="position()" (click)="internalOnClick($any($event))">
			<ngt-mesh-basic-material transparent [opacity]="0.6" [color]="color()" [visible]="hover()" />
			<ngt-box-geometry *args="dimensions()" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class EdgeCube {
	dimensions = input.required<XYZ>();
	position = input.required<THREE.Vector3>();
	hoverColor = input(colors.hover, {
		transform: (value: string | undefined) => {
			if (value === undefined) return colors.hover;
			return value;
		},
	});
	onClick = input<NgtEventHandlers['click']>();

	private meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	private gizmoHelper = inject(NgtsGizmoHelperImpl);

	protected hover = signal(false);
	protected color = computed(() => (this.hover() ? this.hoverColor() : 'white'));

	constructor() {
		extend({ Mesh, BoxGeometry, MeshBasicMaterial });

		// TODO: (chau) remove this when event binding syntax no longer trigger cdr
		objectEvents(this.meshRef, {
			pointerout: (ev) => {
				ev.stopPropagation();
				this.hover.set(false);
			},
			pointerover: (ev) => {
				ev.stopPropagation();
				this.hover.set(true);
			},
		});
	}

	protected internalOnClick(event: NgtThreeEvent<MouseEvent>) {
		const onClick = this.onClick();
		if (onClick) onClick(event);
		else {
			event.stopPropagation();
			this.gizmoHelper.tweenCamera(this.position());
		}
	}
}

export type NgtsGizmoViewcubeOptions = Partial<NgtsViewcubeCommonOptions>;

@Component({
	selector: 'ngts-gizmo-viewcube',
	template: `
		<ngt-group [scale]="60">
			<viewcube-face-cube [options]="options()" [onClick]="onClick" />
			@for (edge of edges; track $index) {
				<viewcube-edge-cube
					[position]="edge"
					[dimensions]="edgeDimensions[$index]"
					[onClick]="onClick"
					[hoverColor]="hoverColor()"
				/>
			}
			@for (corner of corners; track $index) {
				<viewcube-edge-cube
					[position]="corner"
					[dimensions]="cornerDimensions"
					[onClick]="onClick"
					[hoverColor]="hoverColor()"
				/>
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FaceCube, EdgeCube],
})
export class NgtsGizmoViewcube {
	options = input({} as Partial<NgtsGizmoViewcubeOptions>);
	click = output<NgtThreeEvent<MouseEvent>>();

	protected hoverColor = pick(this.options, 'hoverColor');

	protected corners: THREE.Vector3[] = [
		[1, 1, 1],
		[1, 1, -1],
		[1, -1, 1],
		[1, -1, -1],
		[-1, 1, 1],
		[-1, 1, -1],
		[-1, -1, 1],
		[-1, -1, -1],
	].map(this.makePositionVector);
	protected cornerDimensions: XYZ = [0.25, 0.25, 0.25];
	protected edges: THREE.Vector3[] = [
		[1, 1, 0],
		[1, 0, 1],
		[1, 0, -1],
		[1, -1, 0],
		[0, 1, 1],
		[0, 1, -1],
		[0, -1, 1],
		[0, -1, -1],
		[-1, 1, 0],
		[-1, 0, 1],
		[-1, 0, -1],
		[-1, -1, 0],
	].map(this.makePositionVector);
	protected edgeDimensions = this.edges.map(
		(edge) => edge.toArray().map((axis: number): number => (axis == 0 ? 0.5 : 0.25)) as XYZ,
	);

	constructor() {
		extend({ Group });
	}

	protected get onClick() {
		if (hasListener(this.click)) return getEmitter(this.click);
		return undefined;
	}

	private makePositionVector(xyz: number[]) {
		return new THREE.Vector3(...xyz).multiplyScalar(0.38);
	}
}
