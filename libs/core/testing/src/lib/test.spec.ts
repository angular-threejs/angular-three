import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	signal,
	viewChild,
} from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { BoxGeometry, Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import { NgtTestBed } from './test-bed';

describe('test canvas', () => {
	@Component({
		selector: 'app-sphere',
		standalone: true,
		template: `
			<ngt-mesh>
				<ngt-sphere-geometry />
				<ngt-mesh-basic-material color="#ff0000" />
			</ngt-mesh>
		`,
		schemas: [CUSTOM_ELEMENTS_SCHEMA],
	})
	class Sphere {}

	@Component({
		standalone: true,
		template: `
			<ngt-mesh
				#mesh
				[scale]="clicked() ? 1.5 : 1"
				(click)="clicked.set(!clicked())"
				(pointerover)="hovered.set(true)"
				(pointerout)="hovered.set(false)"
			>
				<ngt-box-geometry />
				<ngt-mesh-basic-material [color]="hovered() ? 'hotpink' : 'orange'" />
			</ngt-mesh>

			<app-sphere />
		`,
		schemas: [CUSTOM_ELEMENTS_SCHEMA],
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [Sphere],
	})
	class SceneGraph {
		hovered = signal(false);
		clicked = signal(false);

		meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

		constructor() {
			injectBeforeRender(() => {
				const mesh = this.meshRef().nativeElement;
				mesh.rotation.x += 0.01;
			});
		}
	}

	it('should test', async () => {
		const { scene, fireEvent, advance } = NgtTestBed.create(SceneGraph);

		expect(scene.children.length).toEqual(2);

		const cube = scene.children[0] as Mesh<BoxGeometry, MeshBasicMaterial>;
		const material = cube.material;
		expect(material.color.getHexString()).toEqual('ffa500');

		await fireEvent(cube, 'pointerover');
		expect(material.color.getHexString()).toEqual('ff69b4');

		await fireEvent(cube, 'pointerout');
		expect(material.color.getHexString()).toEqual('ffa500');

		await fireEvent(cube, 'click');
		expect(cube.scale.toArray()).toEqual([1.5, 1.5, 1.5]);

		await fireEvent(cube, 'click');
		expect(cube.scale.toArray()).toEqual([1, 1, 1]);

		expect(cube.rotation.x).toEqual(0);
		await advance(1);

		expect(cube.rotation.x).toEqual(0.01);

		const sphere = scene.children[1] as Mesh<SphereGeometry, MeshBasicMaterial>;
		expect(sphere.geometry).toBeInstanceOf(SphereGeometry);
		expect(sphere.material.color.getHexString()).toEqual('ff0000');
	});
});
