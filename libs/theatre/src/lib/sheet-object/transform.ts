import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { types } from '@theatre/core';
import { IScrub } from '@theatre/studio';
import { extend } from 'angular-three';
import { NgtsTransformControls, NgtsTransformControlsOptions } from 'angular-three-soba/gizmos';
import * as THREE from 'three';
import { Group } from 'three';
import { THEATRE_STUDIO } from '../studio/studio-token';
import { getDefaultTransformer } from '../transformers/default-transformer';
import { TheatreSheetObject } from './sheet-object';

@Component({
	selector: 'theatre-transform',
	template: `
		@if (selected()) {
			<ngts-transform-controls
				[object]="$any(group)"
				[options]="options()"
				(mouseDown)="onMouseDown()"
				(mouseUp)="onMouseUp()"
				(change)="onChange()"
			/>
		}

		<ngt-group #group>
			<ng-content />
		</ngt-group>
	`,
	imports: [NgtsTransformControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheatreSheetObjectTransform<TLabel extends string | undefined> {
	label = input<TLabel>();
	key = input<string>();
	options = input(
		{} as Pick<NgtsTransformControlsOptions, 'mode' | 'translationSnap' | 'scaleSnap' | 'rotationSnap' | 'space'>,
	);

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private theatreSheetObject = inject(TheatreSheetObject);
	sheetObject = computed(() => this.theatreSheetObject.sheetObject());
	private studio = inject(THEATRE_STUDIO, { optional: true });

	protected selected = this.theatreSheetObject.selected.asReadonly();
	private scrub?: IScrub;

	private positionTransformer = computed(() =>
		getDefaultTransformer(this.groupRef().nativeElement, 'position', 'position'),
	);
	private rotationTransformer = computed(() =>
		getDefaultTransformer(this.groupRef().nativeElement, 'rotation', 'rotation'),
	);
	private scaleTransformer = computed(() => getDefaultTransformer(this.groupRef().nativeElement, 'scale', 'scale'));

	protected onMouseDown() {
		if (!this.studio) return;
		if (this.scrub) return;
		this.scrub = this.studio().scrub();
	}

	protected onMouseUp() {
		if (!this.scrub) return;
		this.scrub.commit();
		this.scrub = undefined;
	}

	protected onChange() {
		if (!this.scrub) return;

		this.scrub.capture((api) => {
			const sheetObject = this.sheetObject();
			if (!sheetObject) return;

			const group = this.groupRef().nativeElement;

			const key = this.key();
			const baseTarget = key ? sheetObject.props[key] : sheetObject.props;

			api.set(baseTarget['position'], { ...group.position });
			api.set(baseTarget['rotation'], {
				x: group.rotation.x * THREE.MathUtils.RAD2DEG,
				y: group.rotation.y * THREE.MathUtils.RAD2DEG,
				z: group.rotation.z * THREE.MathUtils.RAD2DEG,
			});
			api.set(baseTarget['scale'], { ...group.scale });
		});
	}

	constructor() {
		extend({ Group });

		afterNextRender(() => {
			this.init();
		});

		effect((onCleanup) => {
			const [sheetObject, key, positionTransformer, rotationTransformer, scaleTransformer, group] = [
				this.sheetObject(),
				untracked(this.key),
				untracked(this.positionTransformer),
				untracked(this.rotationTransformer),
				untracked(this.scaleTransformer),
				untracked(this.groupRef).nativeElement,
			];

			const cleanup = sheetObject.onValuesChange((newValues) => {
				let object = newValues;

				if (key) {
					if (!newValues[key]) return;
					object = newValues[key];
				} else {
					if (!newValues['position'] || !newValues['rotation'] || !newValues['scale']) return;
				}

				// sanity check
				if (!object) return;

				positionTransformer.apply(group, 'position', object['position']);
				rotationTransformer.apply(group, 'rotation', object['rotation']);
				scaleTransformer.apply(group, 'scale', object['scale']);
			});

			onCleanup(cleanup);
		});

		inject(DestroyRef).onDestroy(() => {
			const key = this.key();
			this.theatreSheetObject.removeProps(key ? [key] : ['position', 'rotation', 'scale']);
		});
	}

	private init() {
		const [group, key, label, positionTransformer, rotationTransformer, scaleTransformer] = [
			this.groupRef().nativeElement,
			this.key(),
			this.label(),
			this.positionTransformer(),
			this.rotationTransformer(),
			this.scaleTransformer(),
		];

		const position = positionTransformer.transform(group.position);
		const rotation = rotationTransformer.transform(group.rotation);
		const scale = scaleTransformer.transform(group.scale);

		if (key) {
			this.theatreSheetObject.addProps({
				[key]: types.compound({ position, rotation, scale }, { label: label ?? key }),
			});
		} else {
			this.theatreSheetObject.addProps({ position, rotation, scale });
		}
	}
}
