import { NgFor, NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed } from '@angular/core';
import { extend, injectNgtRef, signalStore, type NgtBeforeRenderEvent, type NgtGroup } from 'angular-three';
import { NgtsBillboard } from 'angular-three-soba/abstractions';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { Group, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';

const CLOUD_URL = 'https://rawcdn.githack.com/pmndrs/drei-assets/9225a9f1fbd449d9411125c2f419b843d0308c9f/cloud.png';
(injectNgtsTextureLoader as any).preload(() => CLOUD_URL);

extend({ Group, Mesh, PlaneGeometry, MeshStandardMaterial });

export type NgtsCloudState = {
	opacity: number;
	speed: number;
	width: number;
	depth: number;
	segments: number;
	texture: string;
	color: THREE.ColorRepresentation;
	depthTest: boolean;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-cloud': NgtsCloudState & NgtGroup;
	}
}

@Component({
	selector: 'ngts-cloud',
	standalone: true,
	template: `
		<ngt-group ngtCompound>
			<ngt-group
				[position]="[0, 0, (segments() / 2) * depth()]"
				[ref]="groupRef"
				(beforeRender)="onBeforeRender($event)"
			>
				<ngts-billboard
					*ngFor="let cloud of clouds(); let i = index"
					[position]="[cloud.x, cloud.y, -i * depth()]"
				>
					<ngt-mesh [scale]="cloud.scale" [rotation]="[0, 0, 0]">
						<ngt-plane-geometry />
						<ngt-mesh-standard-material
							[map]="texture()"
							[transparent]="true"
							[opacity]="(cloud.scale / 6) * cloud.density * opacity()"
							[depthTest]="depthTest()"
							[color]="color()"
						/>
					</ngt-mesh>
				</ngts-billboard>
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgFor, NgtsBillboard, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCloud {
	private inputs = signalStore<NgtsCloudState>({
		opacity: 0.5,
		speed: 0.4,
		width: 10,
		depth: 1.5,
		segments: 20,
		texture: CLOUD_URL,
		color: '#ffffff',
		depthTest: true,
	});

	@Input() groupRef = injectNgtRef<Group>();

	@Input({ alias: 'opacity' }) set _opacity(opacity: number) {
		this.inputs.set({ opacity });
	}

	@Input({ alias: 'speed' }) set _speed(speed: number) {
		this.inputs.set({ speed });
	}

	@Input({ alias: 'width' }) set _width(width: number) {
		this.inputs.set({ width });
	}

	@Input({ alias: 'depth' }) set _depth(depth: number) {
		this.inputs.set({ depth });
	}

	@Input({ alias: 'segments' }) set _segments(segments: number) {
		this.inputs.set({ segments });
	}

	@Input({ alias: 'texture' }) set _texture(texture: string) {
		this.inputs.set({ texture });
	}

	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}

	@Input({ alias: 'depthTest' }) set _depthTest(depthTest: boolean) {
		this.inputs.set({ depthTest });
	}

	private width = this.inputs.select('width');
	private speed = this.inputs.select('speed');

	readonly segments = this.inputs.select('segments');
	readonly depth = this.inputs.select('depth');
	readonly depthTest = this.inputs.select('depthTest');
	readonly opacity = this.inputs.select('opacity');
	readonly color = this.inputs.select('color');
	readonly texture = injectNgtsTextureLoader(this.inputs.select('texture'));

	readonly clouds = computed(() =>
		[...new Array(this.segments())].map((_, index) => ({
			x: this.width() / 2 - Math.random() * this.width(),
			y: this.width() / 2 - Math.random() * this.width(),
			scale: 0.4 + Math.sin(((index + 1) / this.segments()) * Math.PI) * ((0.2 + Math.random()) * 10),
			density: Math.max(0.2, Math.random()),
			rotation: Math.max(0.002, 0.005 * Math.random()) * this.speed(),
		})),
	);
	onBeforeRender({ state, object }: NgtBeforeRenderEvent<Group>) {
		const clouds = this.clouds();
		object.children.forEach((cloud, index) => {
			cloud.children[0].rotation.z += clouds[index].rotation;
			cloud.children[0].scale.setScalar(
				clouds[index].scale + (((1 + Math.sin(state.clock.getElapsedTime() / 10)) / 2) * index) / 10,
			);
		});
	}
}
