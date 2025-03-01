import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { NgtrInstancedRigidBodies, NgtrInteractionGroups, NgtrRigidBody } from 'angular-three-rapier';
import { NgtrAttractor } from 'angular-three-rapier/addons';
import { NgtsHTML } from 'angular-three-soba/misc';

@Component({
	selector: 'app-attractors-rapier',
	template: `
		<ngt-group>
			<ngt-object3D [instancedRigidBodies]="instances" [options]="{ colliders: 'ball' }">
				<ngt-instanced-mesh *args="[undefined, undefined, 100]" castShadow>
					<ngt-sphere-geometry *args="[1]" />
					<ngt-mesh-physical-material [roughness]="0.5" [metalness]="0.5" color="green" />
				</ngt-instanced-mesh>
			</ngt-object3D>

			<ngt-object3D
				rigidBody
				[options]="{ colliders: 'ball' }"
				[position]="[-21, 50, 0]"
				[interactionGroups]="[1]"
			>
				<ngt-mesh>
					<ngt-sphere-geometry />
				</ngt-mesh>
				<ngts-html>
					<div htmlContent>Nested Attractor</div>
				</ngts-html>
				<ngt-object3D attractor [interactionGroups]="[1, 2]" [options]="{ strength: 4 }" />
			</ngt-object3D>

			<ngt-group [position.x]="20">
				<ngt-object3D attractor [options]="{ strength: -2, range: 20 }" />
				<ngts-html>
					<div htmlContent>Repeller</div>
				</ngts-html>
			</ngt-group>

			<ngt-group [position.x]="-20">
				<ngt-object3D attractor [options]="{ strength: 10, range: 20 }" />
				<ngts-html>
					<div htmlContent>Attractor</div>
				</ngts-html>
			</ngt-group>
		</ngt-group>
	`,

	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtrInstancedRigidBodies, NgtArgs, NgtrRigidBody, NgtrInteractionGroups, NgtsHTML, NgtrAttractor],
})
export default class AttractorsExample {
	protected instances = Array.from({ length: 100 }, (_, index) => ({
		key: index,
		position: [Math.floor(Math.random() * 30), Math.random() * 30 * 0.5, 0] as NgtVector3,
	}));
}
