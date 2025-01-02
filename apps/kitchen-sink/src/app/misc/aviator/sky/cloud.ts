import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	viewChild,
	viewChildren,
} from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { BoxGeometry, Mesh, MeshPhongMaterial, Object3D } from 'three';
import { COLORS } from '../constants';

@Component({
	selector: 'app-cloud',
	template: `
		<ngt-object3D #cloud>
			@for (i of count; track $index) {
				<ngt-mesh #mesh [geometry]="geometry" [material]="material" [castShadow]="true" [receiveShadow]="true" />
			}
		</ngt-object3D>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Cloud {
	protected material = new MeshPhongMaterial({ color: COLORS.white });
	protected geometry = new BoxGeometry(20, 20, 20);
	protected count = Array.from({ length: 3 + Math.floor(Math.random() * 3) });

	cloudRef = viewChild.required<ElementRef<Object3D>>('cloud');
	private meshesRef = viewChildren<ElementRef<Mesh>>('mesh');

	constructor() {
		effect(() => {
			this.setRandomMatrixEffect();
		});

		injectBeforeRender(() => {
			const cloud = this.cloudRef().nativeElement;
			for (let i = 0; i < cloud.children.length; i++) {
				const child = cloud.children[i];
				child.rotation.y += Math.random() * 0.002 * (i + 1);
				child.rotation.z += Math.random() * 0.005 * (i + 1);
			}
		});
	}

	private setRandomMatrixEffect() {
		const meshes = this.meshesRef();
		if (!meshes.length) return;

		for (const mesh of meshes) {
			mesh.nativeElement.position.x = Math.random() * 10;
			mesh.nativeElement.position.y = Math.random() * 10;
			mesh.nativeElement.position.z = Math.random() * 10;
			mesh.nativeElement.rotation.y = Math.random() * Math.PI * 2;
			mesh.nativeElement.rotation.z = Math.random() * Math.PI * 2;
			const s = 0.1 + Math.random() * 0.9;
			mesh.nativeElement.scale.set(s, s, s);
		}
	}
}
