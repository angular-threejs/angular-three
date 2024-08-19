import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	Signal,
	computed,
	effect,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsAnimation, injectAnimations } from 'angular-three-soba/misc';
import { injectMatcapTexture } from 'angular-three-soba/staging';
import { Bone, Group, MeshStandardMaterial, Object3D, SkinnedMesh } from 'three';
import { GLTF } from 'three-stdlib';
import { makeDecorators, makeStoryObject, select } from '../setup-canvas';

type BotGLTF = GLTF & {
	nodes: { 'Y-Bot': Object3D; YB_Body: SkinnedMesh; YB_Joints: SkinnedMesh; mixamorigHips: Bone };
	materials: { YB_Body: MeshStandardMaterial; YB_Joints: MeshStandardMaterial };
};

@Directive({ selector: '[animations]', standalone: true })
export class BotAnimations {
	animations = input.required<NgtsAnimation>();
	animation = input('Strut');
	referenceRef = input.required<ElementRef<Bone> | undefined>();

	constructor() {
		const groupRef = inject<ElementRef<Group>>(ElementRef);
		const host = computed(() => (this.referenceRef() ? groupRef : null));

		// NOTE: the consumer controls the timing of injectAnimations. It's not afterNextRender anymore
		//  but when the reference is resolved which in this particular case, it is the Bone mixamorigHips
		//  that the animations are referring to.
		const animationsApi = injectAnimations(this.animations, host);
		effect((onCleanup) => {
			if (animationsApi.ready()) {
				const actionName = this.animation();
				animationsApi.actions[actionName]?.reset().fadeIn(0.5).play();
				onCleanup(() => {
					animationsApi.actions[actionName]?.fadeOut(0.5);
				});
			}
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-group [position]="[0, -1, 0]">
			<ngt-grid-helper *args="[10, 20]" />
			@if (gltf(); as gltf) {
				<ngt-group [dispose]="null" [animations]="gltf" [animation]="animation()" [referenceRef]="boneRef()">
					<ngt-group [rotation]="[Math.PI / 2, 0, 0]" [scale]="0.01">
						<ngt-primitive #bone *args="[gltf.nodes.mixamorigHips]" />
						<ngt-skinned-mesh [geometry]="gltf.nodes.YB_Body.geometry" [skeleton]="gltf.nodes.YB_Body.skeleton">
							<ngt-mesh-matcap-material [matcap]="matcapBody.texture()" />
						</ngt-skinned-mesh>
						<ngt-skinned-mesh [geometry]="gltf.nodes.YB_Joints.geometry" [skeleton]="gltf.nodes.YB_Joints.skeleton">
							<ngt-mesh-matcap-material [matcap]="matcapJoints.texture()" />
						</ngt-skinned-mesh>
					</ngt-group>
				</ngt-group>
			}
		</ngt-group>
	`,
	imports: [NgtArgs, BotAnimations],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultAnimationsStory {
	Math = Math;

	animation = input('Strut');

	gltf = injectGLTF(() => './ybot.glb') as Signal<BotGLTF | null>;
	matcapBody = injectMatcapTexture(() => '293534_B2BFC5_738289_8A9AA7');
	matcapJoints = injectMatcapTexture(() => '3A2412_A78B5F_705434_836C47');

	boneRef = viewChild<ElementRef<Bone>>('bone');
}

export default {
	title: 'Misc/injectAnimations',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultAnimationsStory, {
	canvasOptions: { camera: { position: [0, 0, 3] } },
	argsOptions: {
		animation: select('Strut', { options: ['Strut', 'Dance', 'Idle'] }),
	},
});
