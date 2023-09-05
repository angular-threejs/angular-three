import { NgIf, NgTemplateOutlet } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, effect, signal, type Signal } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { injectNgtsGLTFLoader, type NgtsGLTF } from 'angular-three-soba/loaders';
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
				<ng-container *ngTemplateOutlet="skin; context: { matcap: matcapBody, yb: yBot.nodes.YB_Body }" />
				<ng-container *ngTemplateOutlet="skin; context: { matcap: matcapJoints, yb: yBot.nodes.YB_Joints }" />
			</ngt-group>
		</ngt-group>

		<ng-template #skin let-matcap="matcap" let-yb="yb">
			<ngt-skinned-mesh [geometry]="yb.geometry" [skeleton]="yb.skeleton">
				<ngt-mesh-matcap-material [matcap]="matcap.texture()" [skinning]="true" />
			</ngt-skinned-mesh>
		</ng-template>
	`,
	imports: [NgtArgs, NgIf, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultAnimationsStory {
	Math = Math;

	yBotGltf = injectNgtsGLTFLoader(() => 'soba/ybot.glb') as Signal<YBotGLTF>;

	private _bodyIndex = signal('293534_B2BFC5_738289_8A9AA7');
	@Input() set bodyIndex(index: string) {
		this._bodyIndex.set(index);
	}

	matcapBody = injectNgtsMatcapTexture(() => ({ id: this._bodyIndex(), format: 1024 }));
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
		bodyIndex: select('293534_B2BFC5_738289_8A9AA7', {
			options: ['293534_B2BFC5_738289_8A9AA7', '3A2412_A78B5F_705434_836C47'],
		}),
	},
});
