import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, signal } from '@angular/core';
import { extend, NgtArgs, signalStore, type NgtThreeEvent } from 'angular-three';
import { BoxGeometry, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { injectNgtsGizmoHelperApi } from '../gizmo-helper';
import { colors } from './constants';
import { NgtsGizmoViewcubeInput } from './gizmo-viewcube-input';

extend({ Mesh, BoxGeometry, MeshBasicMaterial });

@Component({
	selector: 'ngts-gizmo-viewcube-edge-cube',
	standalone: true,
	template: `
		<ngt-mesh
			[scale]="1.01"
			[position]="position()"
			(pointermove)="onPointerMove($event)"
			(pointerout)="onPointerOut($event)"
			(click)="onClick($event)"
		>
			<ngt-box-geometry *args="dimensions()" />
			<ngt-mesh-basic-material
				[color]="hover() ? viewcubeInput.hoverColor() : 'white'"
				[transparent]="true"
				[opacity]="0.6"
				[visible]="hover()"
			/>
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewcubeEdgeCube {
	private inputs = signalStore<{
		position: THREE.Vector3;
		dimensions: [number, number, number];
	}>();

	private gizmoApi = injectNgtsGizmoHelperApi();

	viewcubeInput = inject(NgtsGizmoViewcubeInput);
	hover = signal(false);

	@Input({ required: true, alias: 'dimensions' }) set _dimensions(dimensions: [number, number, number]) {
		this.inputs.set({ dimensions });
	}

	@Input({ required: true, alias: 'position' }) set _position(position: Vector3) {
		this.inputs.set({ position });
	}

	position = this.inputs.select('position');
	dimensions = this.inputs.select('dimensions');

	constructor() {
		this.viewcubeInput.inputs.patch({ hoverColor: colors.hover });
	}

	onPointerMove(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.hover.set(true);
	}

	onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.hover.set(false);
	}

	onClick(event: NgtThreeEvent<MouseEvent>) {
		if (this.viewcubeInput.viewcubeClick.observed) {
			this.viewcubeInput.viewcubeClick.emit(event);
		} else {
			event.stopPropagation();
			this.gizmoApi.tweenCamera(this.position());
		}
	}
}
