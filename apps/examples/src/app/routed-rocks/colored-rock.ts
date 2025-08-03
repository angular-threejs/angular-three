import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { NgtArgs, NgtEuler, NgtParent, NgtVector3 } from 'angular-three';
import { NgtsText } from 'angular-three-soba/abstractions';
import { FrontSide } from 'three';
import { RockStore } from './store';

@Component({
	template: `
		@if (selectedRock(); as rock) {
			<ngt-group *parent="rock.name">
				<ngt-mesh
					castShadow
					receiveShadow
					[rotation.y]="Math.PI / 4"
					[position.y]="7"
					[scale]="0.5"
				>
					<ngt-box-geometry *args="[0.7, 0.7, 0.7]" />
					<ngt-mesh-phong-material [color]="rock.color" [side]="FrontSide" />
				</ngt-mesh>

				<ngt-group [position.y]="5">
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
								castShadow: true,
							}"
						/>
					}
				</ngt-group>
			</ngt-group>
		}
	`,
	imports: [NgtArgs, NgtsText, NgtParent],
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

	private rockStore = inject(RockStore);
	protected readonly selectedRock = this.rockStore.selectedRock;

	constructor() {
		// NOTE: we can use ng-template for this use-case as well.
		//  Just a little more involved than `NgtParent`
		//
		// effect(() => {
		// 	const colorId = this.colorId();
		// 	if (!colorId) return;
		//
		// 	const templateRef = this.templateRef();
		// 	this.rockStore.coloredRockTemplateRefs.set({
		// 		[colorId]: templateRef,
		// 	});
		// });
		//
		// inject(DestroyRef).onDestroy(() => {
		// 	this.rockStore.coloredRockTemplateRefs.set({});
		// });
	}
}
