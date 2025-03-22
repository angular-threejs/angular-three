import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { beforeRender, NgtArgs } from 'angular-three';
import { BufferGeometry, Float32BufferAttribute } from 'three';

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color attach="background" *args="['black']" />

		@for (i of [1, 2, 3]; track $index) {
			<ngt-line [geometry]="geometry" [scale]="i / 3">
				<ngt-line-basic-material [color]="Math.random() * whiteHex" [linewidth]="10" />
			</ngt-line>
		}

		<ngt-line [geometry]="geometry" [scale]="2">
			<ngt-line-dashed-material color="blue" [linewidth]="1" [dashSize]="10" [gapSize]="10" />
		</ngt-line>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class SceneGraph {
	protected readonly Math = Math;

	protected whiteHex = 0xffffff;
	protected geometry = (() => {
		const divisions = 50;
		const vertices: number[] = [];

		for (let i = 0; i <= divisions; i++) {
			const v = (i / divisions) * (Math.PI * 2);

			const x = Math.sin(v);
			const z = Math.cos(v);

			vertices.push(x, 0, z);
		}

		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

		return geometry;
	})();

	constructor() {
		beforeRender(({ scene }) => {
			let count = 0;
			const time = performance.now() / 1000;
			scene.traverse((child) => {
				child.rotation.x = count + time / 3;
				child.rotation.z = count + time / 4;
				count++;
			});
		});
	}
}
