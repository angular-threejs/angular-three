import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, ViewChild } from '@angular/core';
import { NgtArgs, injectBeforeRender, injectNgtRef } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsTrail, injectNgtsTrail, type NgtsTrailState } from 'angular-three-soba/misc';
import { NgtsFloat } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { Group, InstancedMesh, Mesh } from 'three';
import { makeCanvasOptions, makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-trail color="#f8d628" [attenuation]="attenuation" [settings]="{ width: 1, length: 4 }" [target]="ref" />
		<ngts-float [speed]="5" [floatIntensity]="10" [floatRef]="ref">
			<ngt-mesh [position]="[0, 0, 0]">
				<ngt-sphere-geometry *args="[0.1, 32, 32]" />
				<ngt-mesh-normal-material />
			</ngt-mesh>
		</ngts-float>
	`,
	imports: [NgtsTrail, NgtsFloat, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class TrailFloatStory {
	ref = injectNgtRef<Group>();
	attenuation: NgtsTrailState['attenuation'] = (value) => value * value;
}

@Component({
	standalone: true,
	template: `
		<ngt-mesh [ref]="sphereRef" [position]="[0, 3, 0]">
			<ngt-sphere-geometry *args="[0.1, 32, 32]" />
			<ngt-mesh-normal-material />
		</ngt-mesh>

		<ngt-instanced-mesh [ref]="instancedRef" *args="[undefined, undefined, 1000]">
			<ngt-box-geometry *args="[0.1, 0.1, 0.1]" />
			<ngt-mesh-normal-material />
		</ngt-instanced-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class InjectNgtsTrailInstanceStory {
	sphereRef = injectNgtRef<Mesh>();
	instancedRef = injectNgtRef<InstancedMesh>();

	private positions = injectNgtsTrail(
		() => this.sphereRef,
		() => ({ length: 5, decay: 5, interval: 6 }),
	);

	private obj = new THREE.Object3D();

	constructor() {
		injectBeforeRender(({ clock }) => {
			const sphere = this.sphereRef.nativeElement;
			const t = clock.getElapsedTime();
			sphere.position.x = Math.sin(t) * 3 + Math.cos(t * 2);
			sphere.position.y = Math.cos(t) * 3;
		});

		injectBeforeRender(() => {
			const [instanced, positions] = [this.instancedRef.nativeElement, this.positions.nativeElement];
			if (!instanced || !positions) return;

			for (let i = 0; i < 1000; i += 1) {
				const x = positions.slice(i * 3, i * 3 + 3);
				// @ts-expect-error
				this.obj.position.set(...x);

				this.obj.scale.setScalar((i * 10) / 1000);
				this.obj.updateMatrixWorld();

				instanced.setMatrixAt(i, this.obj.matrixWorld);
			}

			instanced.count = 1000;
			instanced.instanceMatrix.needsUpdate = true;
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-perspective-camera [makeDefault]="true" [position]="[5, 5, 5]" />

		<ngt-group #group>
			<ngts-trail color="#f8d628" [settings]="{ width: 1, length: 4 }" [attenuation]="attenuation">
				<ngt-mesh #sphere [position]="[0, 3, 0]">
					<ngt-sphere-geometry *args="[0.1, 32, 32]" />
					<ngt-mesh-normal-material />
				</ngt-mesh>
			</ngts-trail>
		</ngt-group>

		<ngt-axes-helper />
	`,
	imports: [NgtsTrail, NgtsPerspectiveCamera, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultTrailStory {
	attenuation: NgtsTrailState['attenuation'] = (value) => value * value;

	@ViewChild('sphere', { static: true }) sphere!: ElementRef<Mesh>;
	@ViewChild('group', { static: true }) group!: ElementRef<Group>;

	constructor() {
		injectBeforeRender(({ clock }) => {
			const [sphere, group] = [this.sphere?.nativeElement, this.group?.nativeElement];
			if (sphere && group) {
				const t = clock.getElapsedTime();
				group.rotation.z = t;
				sphere.position.x = Math.sin(t * 2) * 2;
				sphere.position.z = Math.cos(t * 2) * 2;
			}
		});
	}
}

export default {
	title: 'Misc/Trail',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({ camera: { position: [0, 0, 5] } });

export const Default = makeStoryFunction(DefaultTrailStory, canvasOptions);
export const TrailsWithInstance = makeStoryFunction(InjectNgtsTrailInstanceStory, canvasOptions);
export const TrailWithFloat = makeStoryFunction(TrailFloatStory, canvasOptions);

// function UseTrailFloat() {
//   const ref = React.useRef(null!)
//   return (
//     <>
//       <Trail
//         width={1}
//         length={4}
//         color={'#F8D628'}
//         attenuation={(t: number) => {
//           return t * t
//         }}
//         target={ref}
//       />
//       <Float speed={5} floatIntensity={10} ref={ref}>
//         <Sphere args={[0.1, 32, 32]} position-x={0}>
//           <meshNormalMaterial />
//         </Sphere>
//       </Float>
//     </>
//   )
// }
//
// export const TrailFloat = () => <UseTrailFloat />
// TrailFloat.storyName = 'Trail with Ref target'
