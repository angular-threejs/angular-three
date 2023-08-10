import { NgIf, NgTemplateOutlet } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ContentChild, Directive, Input, TemplateRef, effect } from '@angular/core';
import { extend, injectNgtRef, signalStore, type NgtAnyRecord, type NgtLineSegments } from 'angular-three';
import * as THREE from 'three';
import { LineBasicMaterial, LineSegments } from 'three';

export type NgtsEdgesState = {
	threshold: number;
	color: THREE.ColorRepresentation;
	geometry: THREE.BufferGeometry;
	userData: NgtAnyRecord;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-line-segments
		 */
		'ngts-edges': NgtsEdgesState & NgtLineSegments;
	}
}

extend({ LineSegments, LineBasicMaterial });

@Directive({ selector: 'ng-template[ngtsEdgesContent]', standalone: true })
export class NgtsEdgesContent {}

@Component({
	selector: 'ngts-edges',
	standalone: true,
	template: `
		<ngt-line-segments [ref]="edgesRef" [raycast]="nullRaycast" ngtCompound>
			<ng-container *ngIf="content; else defaultMaterial" [ngTemplateOutlet]="content" />
			<ng-template #defaultMaterial>
				<ngt-line-basic-material [color]="color()" />
			</ng-template>
		</ngt-line-segments>
	`,
	imports: [NgIf, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEdges {
	nullRaycast = () => null;

	@ContentChild(NgtsEdgesContent, { read: TemplateRef }) content?: TemplateRef<unknown>;

	private inputs = signalStore<NgtsEdgesState>({ threshold: 15, color: 'black' });

	@Input() edgesRef = injectNgtRef<LineSegments>();

	@Input({ alias: 'threshold' }) set _threshold(threshold: number) {
		this.inputs.set({ threshold });
	}

	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}

	@Input({ alias: 'geometry' }) set _geometry(geometry: THREE.BufferGeometry) {
		this.inputs.set({ geometry });
	}

	@Input({ alias: 'userData' }) set _userData(userData: NgtAnyRecord) {
		this.inputs.set({ userData });
	}

	private geometry = this.inputs.select('geometry');
	private threshold = this.inputs.select('threshold');

	color = this.inputs.select('color');

	constructor() {
		effect(() => {
			const edges = this.edgesRef.nativeElement;
			if (!edges) return;
			const parent = this.edgesRef.nativeElement.parent as THREE.Mesh;
			if (parent) {
				const [geometry, threshold] = [this.geometry() || parent.geometry, this.threshold()];
				if (geometry !== edges.userData['currentGeom'] || threshold !== edges.userData['currentThreshold']) {
					edges.userData['currentGeom'] = geometry;
					edges.userData['currentThreshold'] = threshold;
					edges.geometry = new THREE.EdgesGeometry(geometry, threshold);
				}
			}
		});
	}
}
