import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	viewChild,
} from '@angular/core';
import { injectStore, NgtArgs, NgtEuler, NgtVector3 } from 'angular-three';
import { NgtsText } from 'angular-three-soba/abstractions';
import { FrontSide, Group } from 'three';
import { RockStore } from './store';

@Component({
	template: `
		<ngt-group #group attach="none">
			@if (selectedRock(); as rock) {
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[rotation]="[0, Math.PI / 4, 0]"
					[position]="[0, 2, 0]"
					[scale]="0.5"
				>
					<ngt-box-geometry *args="[0.7, 0.7, 0.7]" />
					<ngt-mesh-phong-material [color]="rock.color" [side]="FrontSide" />
				</ngt-mesh>

				<ngt-group>
					@for (text of texts; track $index) {
						<ngts-text
							font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
							[text]="rock.label"
							[options]="{
								color: rock.color,
								font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
								fontSize: 0.5,
								position: text.position,
								rotation: text.rotation,
							}"
						/>
					}
				</ngt-group>
			}
		</ngt-group>
	`,
	imports: [NgtArgs, NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'colored-rock' },
})
export default class ColoredRock {
	protected readonly Math = Math;
	protected readonly FrontSide = FrontSide;

	protected readonly texts = Array.from({ length: 3 }, (_, index) => ({
		rotation: [0, ((360 / 3) * index * Math.PI) / 180, 0] as NgtEuler,
		position: [
			5 * Math.cos(((360 / 3) * index * Math.PI) / 180),
			0,
			5 * Math.sin(((360 / 3) * index * Math.PI) / 180),
		] as NgtVector3,
	}));

	private groupRef = viewChild.required<ElementRef<Group>>('group');

	private rockStore = inject(RockStore);
	protected readonly selectedRock = this.rockStore.selectedRock;

	private store = injectStore();
	private scene = this.store.select('scene');

	private parent = computed(() => {
		const selected = this.selectedRock();
		if (!selected) return null;

		const parent = this.scene().getObjectByName(selected.name);
		if (!parent) return null;

		return parent;
	});

	constructor() {
		effect((onCleanup) => {
			const parent = this.parent();
			if (!parent) return;

			const group = this.groupRef().nativeElement;

			parent.add(group);
			onCleanup(() => {
				parent.remove(group);
			});
		});
	}
}
