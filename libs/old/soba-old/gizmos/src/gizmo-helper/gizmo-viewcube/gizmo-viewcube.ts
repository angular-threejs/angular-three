import { NgFor } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { extend } from 'angular-three-old';
import { AmbientLight, Group, PointLight } from 'three';
import { cornerDimensions, corners, edgeDimensions, edges } from './constants';
import { NgtsGizmoViewcubeEdgeCube } from './gizmo-viewcube-edge';
import { NgtsGizmoViewcubeFaceCube } from './gizmo-viewcube-face';
import { NgtsGizmoViewcubeInput } from './gizmo-viewcube-input';

extend({ Group, AmbientLight, PointLight });

@Component({
	selector: 'ngts-gizmo-viewcube',
	standalone: true,
	template: `
		<ngt-group [scale]="60">
			<ngts-gizmo-viewcube-face-cube />

			<ngts-gizmo-viewcube-edge-cube
				*ngFor="let edge of edges; let i = index"
				[position]="edge"
				[dimensions]="edgeDimensions[i]"
			/>

			<ngts-gizmo-viewcube-edge-cube
				*ngFor="let corner of corners"
				[position]="corner"
				[dimensions]="cornerDimensions"
			/>

			<ngt-ambient-light [intensity]="0.5" />
			<ngt-point-light [position]="10" [intensity]="0.5" />
		</ngt-group>
	`,
	imports: [NgtsGizmoViewcubeEdgeCube, NgtsGizmoViewcubeFaceCube, NgFor],
	providers: [{ provide: NgtsGizmoViewcubeInput, useExisting: NgtsGizmoViewcube }],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewcube extends NgtsGizmoViewcubeInput {
	edges = edges;
	edgeDimensions = edgeDimensions;

	corners = corners;
	cornerDimensions = cornerDimensions;
}
