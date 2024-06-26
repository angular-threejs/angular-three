import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NGT_STORE_SIGNAL, NgtPortal, NgtPortalContent, extend, provideNgtStore } from 'angular-three';
import * as THREE from 'three';
import { Scene } from 'three';

extend(THREE);

@Component({
	selector: 'app-experience',
	standalone: true,
	template: `
		<ngt-portal [container]="sceneOne">
			<ng-template portalContent let-store="store">
				<ngt-portal [container]="sceneTwo" [myParentStore]="store">
					<ng-template portalContent let-store="store">
						<ngt-portal [container]="sceneThree" [myParentStore]="store">
							<ng-template portalContent></ng-template>
						</ngt-portal>
					</ng-template>
				</ngt-portal>
			</ng-template>
		</ngt-portal>
	`,
	providers: [provideNgtStore(), { provide: NGT_STORE_SIGNAL, useValue: signal({ scene: new Scene() }) }],
	imports: [NgtPortal, NgtPortalContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'fbo-experience' },
})
export class Experience {
	sceneOne = new Scene();
	sceneTwo = new Scene();
	sceneThree = new Scene();

	constructor() {
		this.sceneOne.name = 'sceneOne';
		this.sceneTwo.name = 'sceneTwo';
		this.sceneThree.name = 'sceneThree';
	}
}
