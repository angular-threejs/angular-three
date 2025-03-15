import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { TheatreSheetObject } from 'angular-three-theatre';

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-ambient-light
			#ambientLight
			*sheetObject="'Ambient Light'"
			[sync]="ambientLight"
			[syncProps]="['intensity', 'color']"
		/>

		<ng-template sheetObject="Directional Light">
			<theatre-transform>
				<ngt-directional-light
					#directionalLight
					castShadow
					[sync]="directionalLight"
					[syncProps]="['intensity', 'color']"
				/>
			</theatre-transform>
		</ng-template>

		<ng-template sheetObject="Box" let-select="select" let-deselect="deselect">
			<theatre-transform>
				<ngt-mesh castShadow (click)="select()" (pointermissed)="deselect()">
					<ngt-box-geometry />
					<ngt-mesh-standard-material
						#boxMaterial
						transparent
						[sync]="boxMaterial"
						[syncProps]="['color', 'roughness', 'metalness', 'side', 'opacity']"
					/>
				</ngt-mesh>
			</theatre-transform>
		</ng-template>

		<ngt-mesh receiveShadow [position.y]="-1" [rotation.x]="-Math.PI / 2">
			<ngt-circle-geometry *args="[1.4, 48]" />
			<ngt-mesh-standard-material />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs, TheatreSheetObject],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'experience-basic-theatre' },
})
export class SceneGraph {
	protected readonly Math = Math;
}
