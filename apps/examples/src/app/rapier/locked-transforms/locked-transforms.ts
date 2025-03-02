import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtrRigidBody } from 'angular-three-rapier';
import { NgtsHTML } from 'angular-three-soba/misc';
import { ResetOrbitControls } from '../reset-orbit-controls';

@Component({
	selector: 'app-rapier-locked-transforms',
	template: `
		<ngt-group>
			<ngt-object3D
				rigidBody
				[position]="[0, 10, 0]"
				[options]="{ colliders: 'hull', lockRotations: true, restitution: 1 }"
			>
				<ngt-mesh castShadow receiveShadow [scale]="3">
					<ngt-torus-geometry />
					<ngt-mesh-physical-material />
					<ngts-html>
						<div htmlContent>Locked Rotations</div>
					</ngts-html>
				</ngt-mesh>
			</ngt-object3D>

			<ngt-object3D
				rigidBody
				[position]="[0, 5, 0]"
				[options]="{ colliders: 'hull', lockTranslations: true, restitution: 1 }"
			>
				<ngt-mesh castShadow receiveShadow [scale]="3">
					<ngt-torus-geometry />
					<ngt-mesh-physical-material />
					<ngts-html>
						<div htmlContent>Locked Translations</div>
					</ngts-html>
				</ngt-mesh>
			</ngt-object3D>

			<ngt-object3D
				rigidBody
				[position]="[0, 0, 0]"
				[options]="{ colliders: 'hull', enabledRotations: [true, false, false], restitution: 1 }"
			>
				<ngt-mesh castShadow receiveShadow [scale]="3">
					<ngt-torus-geometry />
					<ngt-mesh-physical-material />
					<ngts-html>
						<div htmlContent>Enabled Rotations [true, false, false]</div>
					</ngts-html>
				</ngt-mesh>
			</ngt-object3D>

			<ngt-object3D
				rigidBody
				[position]="[0, 15, 0]"
				[options]="{ colliders: 'hull', enabledTranslations: [true, false, false], restitution: 1 }"
			>
				<ngt-mesh castShadow receiveShadow [scale]="3">
					<ngt-torus-geometry />
					<ngt-mesh-physical-material />
					<ngts-html>
						<div htmlContent>Enabled Translations [true, false, false]</div>
					</ngts-html>
				</ngt-mesh>
			</ngt-object3D>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	hostDirectives: [ResetOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody, NgtsHTML],
})
export default class LockedTransformsExample {}
