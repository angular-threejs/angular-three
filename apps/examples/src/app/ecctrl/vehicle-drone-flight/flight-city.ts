import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtrCuboidCollider, NgtrCylinderCollider, NgtrRigidBody } from 'angular-three-rapier';
import { NgtsInstance, NgtsInstances } from 'angular-three-soba/performances';
import { createFlightCity } from './flight-city-data';

@Component({
	selector: 'app-ecctrl-flight-city',
	template: `
		<ngt-object3D rigidBody="fixed" [options]="{ colliders: false }">
			<ngt-object3D [cuboidCollider]="[105, 0.5, 105]" [position]="[0, -0.5, 0]" />
			@for (building of city.buildings; track building.id) {
				<ngt-object3D
					[cuboidCollider]="[building.scale[0] / 2, building.scale[1] / 2, building.scale[2] / 2]"
					[position]="building.position"
				/>
			}
			<ngt-object3D [cylinderCollider]="[15, 3.5]" [position]="[-11.5, 15, -24]" />
			<ngt-object3D [cylinderCollider]="[15, 3.5]" [position]="[11.5, 15, -24]" />
			<ngt-object3D [cuboidCollider]="[14.5, 1.5, 2.5]" [position]="[0, 24.5, -24]" />
			<ngt-object3D [cylinderCollider]="[18, 3.5]" [position]="[48, 18, 48]" />
		</ngt-object3D>

		<ngt-mesh receiveShadow [position]="[0, -0.5, 0]" [scale]="[210, 1, 210]">
			<ngt-box-geometry />
			<ngt-mesh-standard-material color="#111827" [metalness]="0" [roughness]="0.95" />
		</ngt-mesh>

		<ngts-instances
			[options]="{ limit: city.sidewalks.length, frames: 2, receiveShadow: true, frustumCulled: false }"
		>
			<ngt-box-geometry />
			<ngt-mesh-standard-material color="#283548" [metalness]="0.02" [roughness]="0.9" />
			@for (sidewalk of city.sidewalks; track sidewalk.id) {
				<ngts-instance [options]="{ position: sidewalk.position, scale: sidewalk.scale }" />
			}
		</ngts-instances>

		@for (district of city.districts; track district.id) {
			<ngts-instances
				[options]="{
					limit: district.buildings.length,
					frames: 2,
					castShadow: true,
					receiveShadow: true,
					frustumCulled: false,
				}"
			>
				<ngt-box-geometry />
				<ngt-mesh-standard-material vertexColors [metalness]="0.05" [roughness]="0.78" />
				@for (building of district.buildings; track building.id) {
					<ngts-instance
						[options]="{
							position: building.position,
							scale: building.scale,
							color: building.color,
						}"
					/>
				}
			</ngts-instances>
		}

		<ngts-instances [options]="{ limit: city.rooftops.length, frames: 2, castShadow: true, frustumCulled: false }">
			<ngt-box-geometry />
			<ngt-mesh-standard-material vertexColors color="#172033" [metalness]="0.18" [roughness]="0.72" />
			@for (rooftop of city.rooftops; track rooftop.id) {
				<ngts-instance [options]="{ position: rooftop.position, scale: rooftop.scale, color: rooftop.color }" />
			}
		</ngts-instances>

		<ngts-instances [options]="{ limit: city.windowsWarm.length, frames: 2, frustumCulled: false }">
			<ngt-box-geometry />
			<ngt-mesh-standard-material
				color="#ffc57a"
				emissive="#ff9f43"
				[emissiveIntensity]="1.1"
				[metalness]="0.1"
				[roughness]="0.42"
			/>
			@for (window of city.windowsWarm; track window.id) {
				<ngts-instance [options]="{ position: window.position, scale: window.scale }" />
			}
		</ngts-instances>

		<ngts-instances [options]="{ limit: city.windowsCool.length, frames: 2, frustumCulled: false }">
			<ngt-box-geometry />
			<ngt-mesh-standard-material
				color="#8be9f6"
				emissive="#22d3ee"
				[emissiveIntensity]="0.75"
				[metalness]="0.12"
				[roughness]="0.38"
			/>
			@for (window of city.windowsCool; track window.id) {
				<ngts-instance [options]="{ position: window.position, scale: window.scale }" />
			}
		</ngts-instances>

		<ngts-instances [options]="{ limit: city.laneMarkings.length, frames: 2, frustumCulled: false }">
			<ngt-box-geometry />
			<ngt-mesh-standard-material
				color="#cbd5e1"
				emissive="#94a3b8"
				[emissiveIntensity]="0.18"
				[roughness]="0.75"
			/>
			@for (marking of city.laneMarkings; track marking.id) {
				<ngts-instance [options]="{ position: marking.position, scale: marking.scale }" />
			}
		</ngts-instances>

		<ngts-instances [options]="{ limit: city.lampPoles.length, frames: 2, castShadow: true, frustumCulled: false }">
			<ngt-cylinder-geometry *args="[0.5, 0.5, 1, 8]" />
			<ngt-mesh-standard-material color="#334155" [metalness]="0.72" [roughness]="0.4" />
			@for (lamp of city.lampPoles; track lamp.id) {
				<ngts-instance [options]="{ position: lamp.position, scale: lamp.scale }" />
			}
		</ngts-instances>

		<ngts-instances [options]="{ limit: city.lampHeads.length, frames: 2, frustumCulled: false }">
			<ngt-sphere-geometry *args="[0.5, 10, 8]" />
			<ngt-mesh-standard-material
				color="#ffddb0"
				emissive="#ff9f43"
				[emissiveIntensity]="2.4"
				[roughness]="0.34"
			/>
			@for (lamp of city.lampHeads; track lamp.id) {
				<ngts-instance [options]="{ position: lamp.position, scale: lamp.scale }" />
			}
		</ngts-instances>

		<ngt-group [position]="[0, 0.09, 36]">
			<ngt-mesh receiveShadow>
				<ngt-cylinder-geometry *args="[7, 7, 0.16, 48]" />
				<ngt-mesh-standard-material color="#202d3d" [metalness]="0.35" [roughness]="0.66" />
			</ngt-mesh>
			<ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
				<ngt-torus-geometry *args="[5.5, 0.16, 8, 48]" />
				<ngt-mesh-standard-material color="#67e8f9" emissive="#22d3ee" [emissiveIntensity]="2.5" />
			</ngt-mesh>
			<ngt-mesh [position]="[-1.5, 0.13, 0]" [scale]="[0.35, 0.08, 3]">
				<ngt-box-geometry />
				<ngt-mesh-basic-material color="#cffafe" />
			</ngt-mesh>
			<ngt-mesh [position]="[1.5, 0.13, 0]" [scale]="[0.35, 0.08, 3]">
				<ngt-box-geometry />
				<ngt-mesh-basic-material color="#cffafe" />
			</ngt-mesh>
			<ngt-mesh [position]="[0, 0.13, 0]" [scale]="[3, 0.08, 0.35]">
				<ngt-box-geometry />
				<ngt-mesh-basic-material color="#cffafe" />
			</ngt-mesh>
		</ngt-group>

		<ngt-group [position]="[0, 0, -24]">
			@for (x of [-11.5, 11.5]; track x) {
				<ngt-mesh castShadow receiveShadow [position]="[x, 15, 0]">
					<ngt-cylinder-geometry *args="[3.2, 3.8, 30, 8]" />
					<ngt-mesh-standard-material color="#24364a" [metalness]="0.14" [roughness]="0.7" />
				</ngt-mesh>
				<ngt-mesh [position]="[x, 30.6, 0]">
					<ngt-cylinder-geometry *args="[2.4, 3.4, 1.2, 8]" />
					<ngt-mesh-standard-material color="#67e8f9" emissive="#22d3ee" [emissiveIntensity]="1.3" />
				</ngt-mesh>
			}
			<ngt-mesh castShadow receiveShadow [position]="[0, 24.5, 0]" [scale]="[29, 3, 5]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#29394d" [metalness]="0.16" [roughness]="0.66" />
			</ngt-mesh>
			<ngt-mesh [position]="[0, 24.5, 2.56]" [scale]="[18, 0.45, 0.08]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#fb7185" emissive="#f43f5e" [emissiveIntensity]="1.8" />
			</ngt-mesh>
		</ngt-group>

		<ngt-group [position]="[48, 0, 48]">
			<ngt-mesh castShadow receiveShadow [position]="[0, 18, 0]">
				<ngt-cylinder-geometry *args="[2.4, 3.5, 36, 8]" />
				<ngt-mesh-standard-material color="#25364a" [metalness]="0.18" [roughness]="0.66" />
			</ngt-mesh>
			<ngt-mesh castShadow [position]="[0, 37.5, 0]">
				<ngt-cylinder-geometry *args="[6.5, 4.2, 3, 10]" />
				<ngt-mesh-standard-material color="#31465d" [metalness]="0.2" [roughness]="0.6" />
			</ngt-mesh>
			<ngt-mesh [position]="[0, 42, 0]">
				<ngt-cone-geometry *args="[0.7, 7, 8]" />
				<ngt-mesh-standard-material color="#fb7185" emissive="#f43f5e" [emissiveIntensity]="1.8" />
			</ngt-mesh>
		</ngt-group>

		@for (gate of flightGates; track gate.position[2]) {
			<ngt-group [position]="gate.position">
				<ngt-mesh [rotation]="[0, 0, gate.rotation]">
					<ngt-torus-geometry *args="[gate.radius, 0.24, 10, 64]" />
					<ngt-mesh-standard-material
						color="#67e8f9"
						emissive="#22d3ee"
						[emissiveIntensity]="2.8"
						[metalness]="0.35"
						[roughness]="0.28"
					/>
				</ngt-mesh>
				<ngt-point-light color="#22d3ee" [decay]="2" [distance]="16" [intensity]="8" />
			</ngt-group>
		}
	`,
	imports: [NgtArgs, NgtrCuboidCollider, NgtrCylinderCollider, NgtrRigidBody, NgtsInstance, NgtsInstances],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightCity {
	protected readonly Math = Math;
	protected readonly city = createFlightCity();
	protected readonly flightGates: Array<{
		position: [number, number, number];
		radius: number;
		rotation: number;
	}> = [
		{ position: [0, 11, 0], radius: 5.5, rotation: -0.08 },
		{ position: [0, 18, -38], radius: 6.2, rotation: 0.12 },
		{ position: [0, 25, -76], radius: 7, rotation: -0.14 },
	];
}
