import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtThreeEvent } from 'angular-three';
import { NgtpBloom, NgtpEffectComposer } from 'angular-three-postprocessing';
import { NgtpN8AO } from 'angular-three-postprocessing/n8ao';
import { Color, InstancedMesh, Object3D } from 'three';
import niceColors from '../../colors';

/* credit: https://pmndrs.github.io/examples/demos/instanced-vertex-colors */

const tempObject = new Object3D();
const tempColor = new Color();
const data = Array.from({ length: 1000 }, () => ({ color: niceColors[Math.floor(Math.random() * 5)], scale: 1 }));

@Component({
	selector: 'app-boxes',
	template: `
		<ngt-instanced-mesh
			#mesh
			*args="[undefined, undefined, 1000]"
			(pointermove)="onPointerMove($any($event))"
			(pointerout)="onPointerOut($any($event))"
		>
			<ngt-box-geometry *args="[0.6, 0.6, 0.6]">
				<ngt-instanced-buffer-attribute attach="attributes.color" *args="[colors, 3]" />
			</ngt-box-geometry>
			<ngt-mesh-basic-material vertexColors [toneMapped]="false" />
		</ngt-instanced-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Boxes {
	private meshRef = viewChild<ElementRef<InstancedMesh>>('mesh');

	protected colors = Float32Array.from(
		Array.from({ length: 1000 }, (_, i) => i).flatMap((_, i) => tempColor.set(data[i].color).toArray()),
	);

	protected hovered = signal<number | undefined>(undefined);
	protected prev?: number;

	constructor() {
		injectBeforeRender(({ clock }) => {
			const instanced = this.meshRef()?.nativeElement;
			if (!instanced) return;

			const time = clock.elapsedTime;
			instanced.rotation.x = Math.sin(time / 4);
			instanced.rotation.y = Math.sin(time / 2);

			const hovered = this.hovered();

			let i = 0;
			for (let x = 0; x < 10; x++) {
				for (let y = 0; y < 10; y++) {
					for (let z = 0; z < 10; z++) {
						const id = i++;
						tempObject.position.set(5 - x, 5 - y, 5 - z);
						tempObject.rotation.y =
							Math.sin(x / 4 + time) + Math.sin(y / 4 + time) + Math.sin(z / 4 + time);
						tempObject.rotation.z = tempObject.rotation.y * 2;

						if (hovered !== this.prev) {
							(id === hovered ? tempColor.setRGB(10, 10, 10) : tempColor.set(data[id].color)).toArray(
								this.colors,
								id * 3,
							);
							instanced.geometry.attributes['color'].needsUpdate = true;
						}

						tempObject.updateMatrix();
						instanced.setMatrixAt(id, tempObject.matrix);
					}
				}
			}

			instanced.instanceMatrix.needsUpdate = true;
		});
	}

	onPointerMove(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.prev = untracked(this.hovered);
		this.hovered.set(event.instanceId);
	}

	onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.prev = untracked(this.hovered);
		this.hovered.set(undefined);
	}
}

@Component({
	selector: 'app-instanced-vertex-colors-scene-graph',
	template: `
		<ngt-color attach="background" *args="['#282828']" />
		<app-boxes />
		@if (!asRenderTexture()) {
			<ngtp-effect-composer [options]="{ enableNormalPass: false }">
				<ngtp-n8ao [options]="{ aoRadius: 0.5, intensity: Math.PI }" />
				<ngtp-bloom
					[options]="{ luminanceThreshold: 1, intensity: 0.5 * Math.PI, levels: 9, mipmapBlur: true }"
				/>
			</ngtp-effect-composer>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'instanced-vertex-colors-soba-experience' },
	imports: [NgtArgs, Boxes, NgtpEffectComposer, NgtpN8AO, NgtpBloom],
})
export class SceneGraph {
	protected readonly Math = Math;

	asRenderTexture = input(false, { transform: booleanAttribute });
}
