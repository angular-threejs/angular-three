import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { extend } from 'angular-three';
import { gltfResource } from 'angular-three-soba/loaders';
import {
	NgtsHTML,
	type NgtsHTMLOcclusionFrame,
	type NgtsHTMLOcclusionStrategy,
	type NgtsHTMLOcclusionTarget,
} from 'angular-three-soba/misc';
import { Group, Matrix4, Mesh, type MeshStandardMaterial, type Object3D, Ray, Vector3, type Vector3Tuple } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { type GLTF, MeshSurfaceSampler } from 'three-stdlib';
import { HtmlOcclusionMetrics, type HtmlOcclusionMode } from './metrics';

export type SpaceshipLabelCount = 6 | 64 | 128 | 256;

type SpaceshipGLTF = GLTF & {
	nodes: {
		Cube005: Mesh;
		Cube005_1: Mesh;
		Cube005_2: Mesh;
	};
	materials: {
		PaletteMaterial001: MeshStandardMaterial;
		PaletteMaterial003: MeshStandardMaterial;
		PaletteMaterial002: MeshStandardMaterial;
	};
};

interface SpaceshipHotspot {
	readonly id: string;
	readonly system: string;
	readonly label: string;
	readonly position: Vector3Tuple;
}

const HOTSPOTS: readonly SpaceshipHotspot[] = [
	{ id: 'navigation', system: 'Navigation', label: 'Nose array', position: [0, 0, 2.62] },
	{ id: 'flight-deck', system: 'Flight deck', label: 'Cockpit', position: [0, 0.42, 0.72] },
	{ id: 'port-wing', system: 'Control surface', label: 'Port wing', position: [-1.96, -0.24, 0.08] },
	{ id: 'starboard-wing', system: 'Control surface', label: 'Starboard wing', position: [1.96, -0.24, 0.08] },
	{ id: 'propulsion', system: 'Propulsion', label: 'Main drive', position: [0, -0.34, -2.45] },
	{ id: 'landing-bay', system: 'Utility', label: 'Ventral bay', position: [0, -1.2, -0.1] },
];

const MAX_TELEMETRY_LABELS = 256;
const SURFACE_CANDIDATE_COUNT = 4096;
const NORMAL_SEPARATION_WEIGHT = 0.2;

function seededRandom(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (Math.imul(1664525, state) + 1013904223) >>> 0;
		return state / 0x100000000;
	};
}

function sampleHullTelemetry(source: Mesh, count: number): readonly SpaceshipHotspot[] {
	const sourceGeometry = source.geometry;
	const geometry = sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry;
	const sampler = new MeshSurfaceSampler(new Mesh(geometry)).setRandomGenerator(seededRandom(0x48554c4c)).build();
	const position = new Vector3();
	const normal = new Vector3();
	const candidates = Array.from({ length: SURFACE_CANDIDATE_COUNT }, () => {
		sampler.sample(position, normal);
		return { position: position.clone(), normal: normal.clone() };
	});
	const selected = new Uint8Array(candidates.length);
	const nearestSelectedDistance = new Float64Array(candidates.length);
	nearestSelectedDistance.fill(Number.POSITIVE_INFINITY);
	let nextCandidateIndex = 0;
	const telemetry = Array.from({ length: count }, (_, index) => {
		const candidate = candidates[nextCandidateIndex]!;
		selected[nextCandidateIndex] = 1;
		position.copy(candidate.position).addScaledVector(candidate.normal, 0.055);

		let largestDistance = Number.NEGATIVE_INFINITY;
		for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
			if (selected[candidateIndex]) continue;
			const other = candidates[candidateIndex]!;
			const normalSeparation = Math.max(0, 1 - candidate.normal.dot(other.normal));
			const distance =
				candidate.position.distanceToSquared(other.position) + normalSeparation * NORMAL_SEPARATION_WEIGHT;
			nearestSelectedDistance[candidateIndex] = Math.min(nearestSelectedDistance[candidateIndex]!, distance);
			if (nearestSelectedDistance[candidateIndex]! > largestDistance) {
				largestDistance = nearestSelectedDistance[candidateIndex]!;
				nextCandidateIndex = candidateIndex;
			}
		}

		return {
			id: `hull-${index + 1}`,
			system: 'Hull telemetry',
			label: `H${String(index + 1).padStart(3, '0')}`,
			position: position.toArray() as Vector3Tuple,
		};
	});

	if (geometry !== sourceGeometry) geometry.dispose();
	return telemetry;
}

interface MeshOccluder {
	readonly mesh: Mesh;
	readonly bvh: MeshBVH;
}

/** Exact triangle occlusion for an arbitrary static mesh hierarchy. */
class MeshBVHOcclusionStrategy implements NgtsHTMLOcclusionStrategy {
	private readonly cameraWorldPosition = new Vector3();
	private readonly targetWorldPosition = new Vector3();
	private readonly localCameraPosition = new Vector3();
	private readonly localTargetPosition = new Vector3();
	private readonly inverseMatrix = new Matrix4();
	private readonly localRay = new Ray();
	private cachedModel?: Object3D;
	private occluders: readonly MeshOccluder[] = [];

	constructor(
		private readonly model: () => Object3D | undefined,
		private readonly metrics: HtmlOcclusionMetrics,
	) {}

	beginFrame(targets: readonly NgtsHTMLOcclusionTarget[], { state }: NgtsHTMLOcclusionFrame) {
		// BVHs are built once when the model identity changes, outside the steady-state frame metric.
		this.refreshOccluders();
		state.camera.getWorldPosition(this.cameraWorldPosition);
		this.metrics.beginCustomFrame(targets.length);
	}

	isOccluded({ anchor }: NgtsHTMLOcclusionTarget, _frame: NgtsHTMLOcclusionFrame) {
		anchor.getWorldPosition(this.targetWorldPosition);

		for (const { mesh, bvh } of this.occluders) {
			if (!mesh.visible) continue;

			this.inverseMatrix.copy(mesh.matrixWorld).invert();
			this.localCameraPosition.copy(this.cameraWorldPosition).applyMatrix4(this.inverseMatrix);
			this.localTargetPosition.copy(this.targetWorldPosition).applyMatrix4(this.inverseMatrix);
			this.localRay.direction.subVectors(this.localTargetPosition, this.localCameraPosition);

			const targetDistance = this.localRay.direction.length();
			if (targetDistance <= 0) continue;

			this.localRay.origin.copy(this.localCameraPosition);
			this.localRay.direction.divideScalar(targetDistance);
			const far = targetDistance - Math.max(0.0001, targetDistance * 0.0001);
			if (far > 0 && bvh.raycastFirst(this.localRay, mesh.material, 0, far)) {
				return this.metrics.recordCustomResult(true);
			}
		}

		return this.metrics.recordCustomResult(false);
	}

	private refreshOccluders() {
		const model = this.model();
		if (model === this.cachedModel) return;

		this.cachedModel = model;
		const occluders: MeshOccluder[] = [];
		model?.traverse((object) => {
			if (!(object instanceof Mesh) || !object.geometry.getAttribute('position')) return;
			occluders.push({
				mesh: object,
				bvh: new MeshBVH(object.geometry, { indirect: true }),
			});
		});
		this.occluders = occluders;
	}
}

@Component({
	selector: 'app-html-occlusion-spaceship',
	template: `
		@if (gltf.value(); as gltf) {
			<ngt-group #model [rotation]="[0.08, -0.42, 0]" [position]="[0, 0.15, 0]" [scale]="1.08">
				<ngt-mesh [geometry]="gltf.nodes.Cube005.geometry" [material]="gltf.materials.PaletteMaterial001" />
				<ngt-mesh [geometry]="gltf.nodes.Cube005_1.geometry" [material]="gltf.materials.PaletteMaterial003" />
				<ngt-mesh [geometry]="gltf.nodes.Cube005_2.geometry" [material]="gltf.materials.PaletteMaterial002" />

				@for (hotspot of hotspots(); track hotspot.id) {
					<ngts-html [options]="{ position: hotspot.position, occlude: occlusion() }">
						<div
							[htmlContent]="{ pointerEvents: 'none' }"
							class="spaceship-hotspot-host"
							aria-hidden="true"
						>
							<span class="spaceship-hotspot" [class.is-telemetry]="labelCount() > 6">
								<span class="spaceship-hotspot-dot"></span>
								<span class="spaceship-hotspot-line"></span>
								<span class="spaceship-hotspot-label">
									<small>{{ hotspot.system }}</small>
									<strong>{{ hotspot.label }}</strong>
								</span>
							</span>
						</div>
					</ngts-html>
				}
			</ngt-group>
		}
	`,
	imports: [NgtsHTML],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: `
		.spaceship-hotspot-host {
			pointer-events: none;
		}

		.spaceship-hotspot {
			display: block;
			position: relative;
			width: 0;
			height: 0;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		}

		.spaceship-hotspot-dot {
			position: absolute;
			top: 0;
			left: 0;
			width: 7px;
			height: 7px;
			transform: translate(-50%, -50%);
			border: 1px solid #ecfeff;
			border-radius: 50%;
			background: #22d3ee;
			box-shadow: 0 0 11px rgba(34, 211, 238, 0.95);
		}

		.spaceship-hotspot-line {
			position: absolute;
			bottom: 5px;
			left: 0;
			width: 1px;
			height: 17px;
			background: linear-gradient(to top, rgba(103, 232, 249, 0.9), rgba(103, 232, 249, 0.12));
		}

		.spaceship-hotspot-label {
			display: grid;
			position: absolute;
			bottom: 24px;
			left: 0;
			gap: 2px;
			min-width: 78px;
			padding: 5px 7px;
			transform: translateX(-50%);
			border: 1px solid rgba(125, 211, 252, 0.34);
			border-radius: 5px;
			background: linear-gradient(145deg, rgba(3, 10, 24, 0.94), rgba(8, 26, 48, 0.88));
			box-shadow: 0 7px 20px rgba(0, 0, 0, 0.34);
			text-align: center;
			white-space: nowrap;
		}

		.spaceship-hotspot-label small {
			color: #67e8f9;
			font-size: 7px;
			font-weight: 700;
			letter-spacing: 0.09em;
			line-height: 1;
			text-transform: uppercase;
		}

		.spaceship-hotspot-label strong {
			color: #e6fbff;
			font-size: 10px;
			font-weight: 650;
			letter-spacing: 0.01em;
			line-height: 1.1;
		}

		.spaceship-hotspot.is-telemetry .spaceship-hotspot-dot {
			width: 5px;
			height: 5px;
		}

		.spaceship-hotspot.is-telemetry .spaceship-hotspot-line {
			height: 10px;
		}

		.spaceship-hotspot.is-telemetry .spaceship-hotspot-label {
			bottom: 17px;
			min-width: 0;
			padding: 3px 4px;
		}

		.spaceship-hotspot.is-telemetry .spaceship-hotspot-label small {
			display: none;
		}

		.spaceship-hotspot.is-telemetry .spaceship-hotspot-label strong {
			font-size: 8px;
			letter-spacing: 0.03em;
		}
	`,
})
export class SpaceshipOcclusionScene {
	mode = input<HtmlOcclusionMode>('analytic');
	labelCount = input<SpaceshipLabelCount>(6);

	protected readonly gltf = gltfResource<SpaceshipGLTF>(() => '/spaceship-transformed.glb', {
		useDraco: true,
	});
	private readonly telemetry = computed(() => {
		const gltf = this.gltf.value();
		return gltf ? sampleHullTelemetry(gltf.nodes.Cube005_2, MAX_TELEMETRY_LABELS) : [];
	});
	protected readonly hotspots = computed(() =>
		this.labelCount() === 6 ? HOTSPOTS : this.telemetry().slice(0, this.labelCount()),
	);
	private readonly modelRef = viewChild<ElementRef<Group>>('model');
	private readonly metrics = inject(HtmlOcclusionMetrics);
	private readonly occlusionStrategy = new MeshBVHOcclusionStrategy(
		() => this.modelRef()?.nativeElement,
		this.metrics,
	);
	protected readonly occlusion = computed(() => (this.mode() === 'analytic' ? this.occlusionStrategy : true));

	constructor() {
		extend({ Group, Mesh });
	}
}

gltfResource.preload('/spaceship-transformed.glb', { useDraco: true });
