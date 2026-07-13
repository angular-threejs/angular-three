import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, injectStore, NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import {
	NgtsHTML,
	type NgtsHTMLOcclusionFrame,
	type NgtsHTMLOcclusionStrategy,
	type NgtsHTMLOcclusionTarget,
} from 'angular-three-soba/misc';
import { Object3D, Vector3, type Intersection } from 'three';
import { AreaPanelOcclusionScene } from './area-panel';
import { HtmlOcclusionMetrics, type HtmlOcclusionMode, type HtmlOcclusionSubject } from './metrics';
import { SpaceshipOcclusionScene, type SpaceshipLabelCount } from './spaceship';

const PLANET_RADIUS = 2;
const MARKER_RADIUS = 2.18;

function sphericalMarkers(count: number) {
	const goldenAngle = Math.PI * (3 - Math.sqrt(5));

	return Array.from({ length: count }, (_, id) => {
		const y = 1 - (id / (count - 1)) * 2;
		const ringRadius = Math.sqrt(1 - y * y);
		const angle = goldenAngle * id;

		return {
			id,
			label: `M${String(id + 1).padStart(2, '0')}`,
			position: [
				Math.cos(angle) * ringRadius * MARKER_RADIUS,
				y * MARKER_RADIUS,
				Math.sin(angle) * ringRadius * MARKER_RADIUS,
			] as [number, number, number],
		};
	});
}

/**
 * Prepares the camera and occluding sphere once, then performs one cheap,
 * allocation-free segment/sphere test per marker.
 */
class SphericalOcclusionStrategy implements NgtsHTMLOcclusionStrategy {
	private readonly cameraPosition = new Vector3();
	private readonly sphereCenter = new Vector3();
	private readonly sphereScale = new Vector3();
	private readonly anchorPosition = new Vector3();
	private readonly cameraToAnchor = new Vector3();
	private readonly cameraToCenter = new Vector3();
	private radiusSquared = 0;

	constructor(
		private readonly sphere: () => Object3D | undefined,
		private readonly radius: number,
		private readonly metrics: HtmlOcclusionMetrics,
	) {}

	beginFrame(targets: readonly NgtsHTMLOcclusionTarget[], { state }: NgtsHTMLOcclusionFrame) {
		this.metrics.beginCustomFrame(targets.length);
		state.camera.getWorldPosition(this.cameraPosition);

		const sphere = this.sphere();
		if (!sphere) {
			this.radiusSquared = 0;
			return;
		}
		sphere.getWorldPosition(this.sphereCenter);
		sphere.getWorldScale(this.sphereScale);
		const worldRadius = this.radius * Math.max(this.sphereScale.x, this.sphereScale.y, this.sphereScale.z);
		this.radiusSquared = worldRadius * worldRadius;
	}

	isOccluded({ anchor }: NgtsHTMLOcclusionTarget, _frame: NgtsHTMLOcclusionFrame) {
		anchor.getWorldPosition(this.anchorPosition);
		this.cameraToAnchor.subVectors(this.anchorPosition, this.cameraPosition);

		const markerDistance = this.cameraToAnchor.length();
		if (markerDistance === 0) return this.metrics.recordCustomResult(false);

		this.cameraToAnchor.divideScalar(markerDistance);
		this.cameraToCenter.subVectors(this.sphereCenter, this.cameraPosition);
		const closestPoint = this.cameraToCenter.dot(this.cameraToAnchor);

		if (closestPoint <= 0 || closestPoint >= markerDistance) return this.metrics.recordCustomResult(false);

		return this.metrics.recordCustomResult(
			this.cameraToCenter.lengthSq() - closestPoint * closestPoint < this.radiusSquared,
		);
	}
}

@Component({
	selector: 'app-html-occlusion-scene-graph',
	template: `
		<ngt-color *args="['#050816']" attach="background" />
		<ngt-ambient-light [intensity]="0.65" />
		<ngt-directional-light [position]="[4, 6, 5]" [intensity]="2.4" />
		<ngt-point-light [position]="[-4, -2, -3]" [intensity]="18" color="#38bdf8" />

		@if (subject() === 'sphere') {
			<ngt-mesh #planet>
				<ngt-sphere-geometry *args="[PLANET_RADIUS, 64, 64]" />
				<ngt-mesh-standard-material color="#102a56" [roughness]="0.68" [metalness]="0.12" />
			</ngt-mesh>

			@for (marker of markers(); track marker.id) {
				<ngts-html [options]="{ position: marker.position, occlude: occlusion() }">
					<div [htmlContent]="{ pointerEvents: 'none' }" class="marker-host" aria-hidden="true">
						<span class="marker">
							<span class="marker-dot"></span>
							<span class="marker-line"></span>
							<span class="marker-label">{{ marker.label }}</span>
						</span>
					</div>
				</ngts-html>
			}
		} @else if (subject() === 'spaceship') {
			<app-html-occlusion-spaceship [mode]="mode()" [labelCount]="spaceshipLabelCount()" />
		} @else {
			<app-html-occlusion-area-panel [mode]="mode()" />
		}

		<ngts-orbit-controls
			[options]="{
				autoRotate: subject() !== 'panel',
				autoRotateSpeed: 0.65,
				enablePan: false,
				enableRotate: subject() !== 'panel',
				enableZoom: subject() !== 'panel',
			}"
		/>
	`,
	imports: [AreaPanelOcclusionScene, NgtArgs, NgtsHTML, NgtsOrbitControls, SpaceshipOcclusionScene],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: `
		.marker-host {
			pointer-events: none;
		}

		.marker {
			display: block;
			position: relative;
			width: 0;
			height: 0;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		}

		.marker-dot {
			position: absolute;
			top: 0;
			left: 0;
			width: 6px;
			height: 6px;
			transform: translate(-50%, -50%);
			border: 1px solid #ecfeff;
			border-radius: 50%;
			background: #22d3ee;
			box-shadow: 0 0 8px rgba(34, 211, 238, 0.8);
		}

		.marker-line {
			position: absolute;
			bottom: 5px;
			left: -0.5px;
			width: 1px;
			height: 11px;
			background: linear-gradient(to top, rgba(103, 232, 249, 0.85), rgba(103, 232, 249, 0.14));
		}

		.marker-label {
			position: absolute;
			bottom: 18px;
			left: 0;
			transform: translateX(-50%);
			padding: 3px 5px;
			border: 1px solid rgba(125, 211, 252, 0.28);
			border-radius: 4px;
			background: rgba(3, 10, 24, 0.88);
			box-shadow: 0 5px 16px rgba(0, 0, 0, 0.28);
			color: #d9faff;
			font-size: 9px;
			font-weight: 650;
			font-variant-numeric: tabular-nums;
			letter-spacing: 0.04em;
			line-height: 1;
			white-space: nowrap;
		}
	`,
})
export class SceneGraph {
	mode = input<HtmlOcclusionMode>('analytic');
	subject = input<HtmlOcclusionSubject>('sphere');
	markerCount = input(64);
	spaceshipLabelCount = input<SpaceshipLabelCount>(6);

	protected readonly PLANET_RADIUS = PLANET_RADIUS;
	protected readonly markers = computed(() => sphericalMarkers(this.markerCount()));
	private readonly metrics = inject(HtmlOcclusionMetrics);
	protected readonly occlusionStrategy = new SphericalOcclusionStrategy(
		() => this.planetRef()?.nativeElement,
		PLANET_RADIUS,
		this.metrics,
	);
	protected readonly occlusion = computed(() => (this.mode() === 'analytic' ? this.occlusionStrategy : true));

	private readonly planetRef = viewChild<ElementRef<Object3D>>('planet');
	private readonly orbitControls = viewChild(NgtsOrbitControls);
	private readonly store = injectStore();
	private readonly destroyRef = inject(DestroyRef);

	constructor() {
		effect(() => {
			if (this.subject() !== 'panel') return;
			// All subjects share one camera and controls instance. Restore the
			// panel's head-on view instead of inheriting the previous subject's orbit.
			this.orbitControls()?.controls().reset();
		});

		this.instrumentDefaultOcclusion();
		beforeRender(({ delta }) => this.metrics.recordFrame(delta));
	}

	/** Measure only the default HTML raycast signature used by this isolated demo. */
	private instrumentDefaultOcclusion() {
		const { raycaster, scene } = this.store.snapshot;
		const originalSetFromCamera = raycaster.setFromCamera;
		const originalIntersectObjects = raycaster.intersectObjects;
		const setFromCamera = originalSetFromCamera.bind(raycaster);
		const intersectObjects = originalIntersectObjects.bind(raycaster) as typeof raycaster.intersectObjects;
		let raycastStartedAt = 0;

		const measuredSetFromCamera: typeof raycaster.setFromCamera = (coordinates, camera) => {
			raycastStartedAt = performance.now();
			return setFromCamera(coordinates, camera);
		};

		const metrics = this.metrics;
		function measuredIntersectObjects<TIntersected extends Object3D>(
			objects: Object3D[],
			recursive?: boolean,
			optionalTarget?: Array<Intersection<TIntersected>>,
		) {
			const intersections = intersectObjects<TIntersected>(objects, recursive, optionalTarget);
			if (raycastStartedAt && recursive && objects.length === 1 && objects[0] === scene) {
				metrics.recordDefaultRaycast(performance.now() - raycastStartedAt);
				raycastStartedAt = 0;
			}
			return intersections;
		}

		raycaster.setFromCamera = measuredSetFromCamera;
		raycaster.intersectObjects = measuredIntersectObjects;
		this.destroyRef.onDestroy(() => {
			if (raycaster.setFromCamera === measuredSetFromCamera) raycaster.setFromCamera = originalSetFromCamera;
			if (raycaster.intersectObjects === measuredIntersectObjects) {
				raycaster.intersectObjects = originalIntersectObjects;
			}
		});
	}
}
