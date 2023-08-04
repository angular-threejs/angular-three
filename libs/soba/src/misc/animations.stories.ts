import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, Signal, effect, signal } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsGLTF, injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { injectNgtsAnimations } from 'angular-three-soba/misc';
import { injectNgtsMatcapTexture } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, select } from '../setup-canvas';

type YBotGLTF = NgtsGLTF<{
	nodes: {
		YB_Body: THREE.SkinnedMesh;
		YB_Joints: THREE.SkinnedMesh;
		mixamorigHips: THREE.Bone;
	};
	materials: {
		YB_Body: THREE.MeshStandardMaterial;
		YB_Joints: THREE.MeshStandardMaterial;
	};
}>;

@Component({
	standalone: true,
	template: `
		<ngt-group *ngIf="yBotGltf() as yBot" [dispose]="null" [position]="[0, -1, 0]" [ref]="animations.ref">
			<ngt-group [rotation]="[Math.PI / 2, 0, 0]" [scale]="0.01">
				<ngt-primitive *args="[yBot.nodes.mixamorigHips]" />
				<ngt-skinned-mesh [geometry]="yBot.nodes.YB_Body.geometry" [skeleton]="yBot.nodes.YB_Body.skeleton">
					<ngt-mesh-matcap-material [matcap]="matcapBody.texture()" [skinning]="true" />
				</ngt-skinned-mesh>
				<ngt-skinned-mesh [geometry]="yBot.nodes.YB_Joints.geometry" [skeleton]="yBot.nodes.YB_Joints.skeleton">
					<ngt-mesh-matcap-material [matcap]="matcapJoints.texture()" [skinning]="true" />
				</ngt-skinned-mesh>
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgtArgs, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultAnimationsStory {
	Math = Math;

	yBotGltf = injectNgtsGLTFLoader(() => 'soba/ybot.glb') as Signal<YBotGLTF>;
	matcapBody = injectNgtsMatcapTexture(() => ({ id: '293534_B2BFC5_738289_8A9AA7', format: 1024 }));
	matcapJoints = injectNgtsMatcapTexture(() => ({ id: '3A2412_A78B5F_705434_836C47', format: 1024 }));

	animations = injectNgtsAnimations(() => this.yBotGltf()?.animations || [], { playFirstClip: false });

	private selected = signal('Strut');

	@Input() set animation(animation: string) {
		this.selected.set(animation);
	}

	constructor() {
		effect((onCleanup) => {
			const selectedAnimation = this.selected();
			if (!this.animations.ready()) return;
			const actions = this.animations.actions;
			if (actions[selectedAnimation]) {
				actions[selectedAnimation].reset().fadeIn(0.5).play();
				onCleanup(() => {
					actions[selectedAnimation].fadeOut(0.5);
				});
			}
		});
	}
}

export default {
	title: 'Misc/injectNgtsAnimations',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultAnimationsStory, {
	canvasOptions: { camera: { position: [0, 0, 3] } },
	argsOptions: {
		animation: select('Strut', { options: ['Strut', 'Dance', 'Idle'] }),
	},
});
