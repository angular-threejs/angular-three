import { NgIf, NgTemplateOutlet } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ContentChild, TemplateRef } from '@angular/core';
import { NgtsSobaContent } from 'angular-three-soba/misc';
import { NgtsEnvironmentCube } from './environment-cube';
import { NgtsEnvironmentGround } from './environment-ground';
import { NgtsEnvironmentInput } from './environment-input';
import { NgtsEnvironmentMap } from './environment-map';
import { NgtsEnvironmentPortal } from './environment-portal';

@Component({
	selector: 'ngts-environment',
	standalone: true,
	template: `
		<ngts-environment-ground *ngIf="ground(); else noGround" />
		<ng-template #noGround>
			<ngts-environment-map *ngIf="map() as map; else noMap" [map]="map" [background]="!!background()" />
			<ng-template #noMap>
				<ngts-environment-portal *ngIf="content; else noPortal">
					<ng-container *ngTemplateOutlet="content" />
				</ngts-environment-portal>
				<ng-template #noPortal>
					<ngts-environment-cube [background]="!!background()" />
				</ng-template>
			</ng-template>
		</ng-template>
	`,
	imports: [
		NgtsEnvironmentMap,
		NgtsEnvironmentGround,
		NgtsEnvironmentCube,
		NgtsEnvironmentPortal,
		NgIf,
		NgTemplateOutlet,
	],
	providers: [{ provide: NgtsEnvironmentInput, useExisting: NgtsEnvironment }],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEnvironment extends NgtsEnvironmentInput {
	@ContentChild(NgtsSobaContent, { read: TemplateRef }) content?: TemplateRef<unknown>;
}
