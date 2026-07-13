import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { beforeRender, NgtArgs } from 'angular-three';
import {
	NgtsHTML,
	type NgtsHTMLOcclusionFrame,
	type NgtsHTMLOcclusionStrategy,
	type NgtsHTMLOcclusionTarget,
} from 'angular-three-soba/misc';
import { Raycaster, Vector2, Vector3, type Camera, type Intersection, type Mesh, type Object3D } from 'three';
import { HtmlOcclusionMetrics, type HtmlOcclusionMode } from './metrics';

const AREA_SAMPLES = [
	[-0.42, -0.42],
	[0, -0.42],
	[0.42, -0.42],
	[-0.42, 0],
	[0, 0],
	[0.42, 0],
	[-0.42, 0.42],
	[0, 0.42],
	[0.42, 0.42],
] as const;

interface TargetMeasurement {
	readonly width: number;
	readonly height: number;
}

/**
 * Observes each HTML surface for its full strategy lifetime, then samples the
 * measured screen area instead of treating the target as one anchor point.
 */
class AreaOcclusionStrategy implements NgtsHTMLOcclusionStrategy {
	private readonly measurements = new WeakMap<NgtsHTMLOcclusionTarget, TargetMeasurement>();
	private readonly targetsBySurface = new WeakMap<HTMLElement, NgtsHTMLOcclusionTarget>();
	private readonly observer =
		typeof ResizeObserver === 'undefined'
			? undefined
			: new ResizeObserver((entries) => {
					for (const entry of entries) {
						const surface = entry.target as HTMLElement;
						const target = this.targetsBySurface.get(surface);
						if (target) this.measure(target, surface);
					}
				});
	private readonly raycaster = new Raycaster();
	private readonly intersections: Intersection<Object3D>[] = [];
	private readonly anchorWorldPosition = new Vector3();
	private readonly anchorNdc = new Vector3();
	private readonly cameraDirection = new Vector3();
	private readonly anchorFromRayOrigin = new Vector3();
	private readonly sampleNdc = new Vector2();
	private camera?: Camera;
	private canvasWidth = 1;
	private canvasHeight = 1;

	constructor(
		private readonly occluder: () => Object3D | undefined,
		private readonly metrics: HtmlOcclusionMetrics,
	) {}

	setupTarget(target: NgtsHTMLOcclusionTarget) {
		const surface = target.element.querySelector<HTMLElement>('[data-occlusion-surface]');
		if (!surface) return;

		this.targetsBySurface.set(surface, target);
		this.measure(target, surface);
		this.observer?.observe(surface);

		return () => {
			this.observer?.unobserve(surface);
			this.targetsBySurface.delete(surface);
			this.measurements.delete(target);
		};
	}

	beginFrame(targets: readonly NgtsHTMLOcclusionTarget[], { state }: NgtsHTMLOcclusionFrame) {
		this.metrics.beginCustomFrame(targets.length);
		this.camera = state.camera;
		this.canvasWidth = Math.max(1, state.size.width);
		this.canvasHeight = Math.max(1, state.size.height);
		state.camera.getWorldDirection(this.cameraDirection);
	}

	isOccluded(target: NgtsHTMLOcclusionTarget, _frame: NgtsHTMLOcclusionFrame) {
		const measurement = this.measurements.get(target);
		const occluder = this.occluder();
		const camera = this.camera;
		if (!measurement || !occluder?.visible || !camera) return this.metrics.recordCustomResult(false);

		target.anchor.getWorldPosition(this.anchorWorldPosition);
		this.anchorNdc.copy(this.anchorWorldPosition).project(camera);

		for (const [sampleX, sampleY] of AREA_SAMPLES) {
			this.sampleNdc.set(
				this.anchorNdc.x + (sampleX * measurement.width * 2) / this.canvasWidth,
				this.anchorNdc.y - (sampleY * measurement.height * 2) / this.canvasHeight,
			);
			this.raycaster.setFromCamera(this.sampleNdc, camera);

			const denominator = this.raycaster.ray.direction.dot(this.cameraDirection);
			if (Math.abs(denominator) < 1e-6) return this.metrics.recordCustomResult(false);

			const targetDistance =
				this.anchorFromRayOrigin
					.subVectors(this.anchorWorldPosition, this.raycaster.ray.origin)
					.dot(this.cameraDirection) / denominator;
			if (targetDistance <= 0) return this.metrics.recordCustomResult(false);

			this.raycaster.near = 0;
			this.raycaster.far = targetDistance - Math.max(0.0001, targetDistance * 0.0001);
			this.intersections.length = 0;
			this.raycaster.intersectObject(occluder, true, this.intersections);
			if (!this.intersections.length) return this.metrics.recordCustomResult(false);
		}

		return this.metrics.recordCustomResult(true);
	}

	private measure(target: NgtsHTMLOcclusionTarget, surface: HTMLElement) {
		const { width, height } = surface.getBoundingClientRect();
		if (width > 0 && height > 0) this.measurements.set(target, { width, height });
	}
}

@Component({
	selector: 'app-html-occlusion-area-panel',
	template: `
		<ngt-mesh [position]="[0, 0, -0.55]">
			<ngt-plane-geometry *args="[5.4, 3.5]" />
			<ngt-mesh-standard-material color="#07162d" [roughness]="0.82" [metalness]="0.08" />
		</ngt-mesh>

		<ngt-mesh #occluder [position]="[0, 0, 1]">
			<ngt-box-geometry *args="[2.55, 1.7, 0.32]" />
			<ngt-mesh-standard-material color="#f97316" [roughness]="0.36" [metalness]="0.28" />
		</ngt-mesh>

		<ngts-html [options]="{ position: [0, 0, 0], occlude: occlusion() }">
			<div [htmlContent]="{ center: true, pointerEvents: 'auto' }" class="area-panel-host">
				<article
					data-occlusion-surface
					class="area-card"
					[class.is-expanded]="expanded()"
					aria-label="Area-aware HTML occlusion target"
				>
					<div class="sample-grid" aria-hidden="true">
						@for (sample of samples; track $index) {
							<span></span>
						}
					</div>
					<div class="card-eyebrow">Observed HTML target</div>
					<h2>Flight telemetry</h2>
					<p>The nine dots are the screen-space points checked against the moving orange occluder.</p>
					<div class="card-meta">
						<span>
							<strong>setupTarget</strong>
							ResizeObserver
						</span>
						<span>
							<strong>isOccluded</strong>
							3 × 3 rays
						</span>
					</div>
					<button type="button" (click)="toggleSize()">
						{{ expanded() ? 'Use compact panel' : 'Resize the panel' }}
					</button>
				</article>
			</div>
		</ngts-html>
	`,
	imports: [NgtArgs, NgtsHTML],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: `
		.area-panel-host {
			pointer-events: auto;
		}

		.area-card {
			display: grid;
			position: relative;
			box-sizing: border-box;
			width: 250px;
			gap: 8px;
			padding: 18px;
			overflow: hidden;
			transition: width 220ms ease;
			border: 1px solid rgba(165, 243, 252, 0.42);
			border-radius: 12px;
			background: linear-gradient(145deg, rgba(3, 12, 30, 0.96), rgba(8, 38, 63, 0.92));
			box-shadow:
				0 18px 48px rgba(0, 0, 0, 0.46),
				0 0 24px rgba(34, 211, 238, 0.09);
			color: #e6fbff;
			font-family: system-ui, sans-serif;
		}

		.area-card.is-expanded {
			width: 370px;
		}

		.card-eyebrow {
			position: relative;
			z-index: 1;
			color: #67e8f9;
			font:
				700 9px/1 ui-monospace,
				SFMono-Regular,
				Menlo,
				Monaco,
				Consolas,
				monospace;
			letter-spacing: 0.14em;
			text-transform: uppercase;
		}

		h2,
		p {
			position: relative;
			z-index: 1;
			margin: 0;
		}

		h2 {
			font-size: 22px;
			letter-spacing: -0.03em;
		}

		p {
			color: #a4c3d4;
			font-size: 12px;
			line-height: 1.45;
		}

		.card-meta {
			display: flex;
			position: relative;
			z-index: 1;
			flex-wrap: wrap;
			gap: 6px;
		}

		.card-meta span {
			padding: 5px 7px;
			border: 1px solid rgba(125, 211, 252, 0.17);
			border-radius: 5px;
			background: rgba(2, 8, 23, 0.68);
			color: #8fb2c5;
			font:
				500 8px/1 ui-monospace,
				SFMono-Regular,
				Menlo,
				Monaco,
				Consolas,
				monospace;
		}

		.card-meta strong {
			margin-right: 4px;
			color: #c7f5ff;
			font-weight: 650;
		}

		button {
			position: relative;
			z-index: 1;
			justify-self: start;
			padding: 7px 10px;
			border: 1px solid rgba(103, 232, 249, 0.35);
			border-radius: 6px;
			background: rgba(8, 47, 73, 0.72);
			color: #cffafe;
			font:
				650 9px/1 ui-monospace,
				SFMono-Regular,
				Menlo,
				Monaco,
				Consolas,
				monospace;
			cursor: pointer;
		}

		button:hover {
			background: rgba(14, 74, 101, 0.82);
		}

		button:focus-visible {
			outline: 2px solid #67e8f9;
			outline-offset: 2px;
		}

		.sample-grid {
			display: grid;
			position: absolute;
			z-index: 0;
			inset: 10%;
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: repeat(3, 1fr);
			place-items: center;
			pointer-events: none;
		}

		.sample-grid span {
			width: 4px;
			height: 4px;
			border: 1px solid rgba(165, 243, 252, 0.5);
			border-radius: 50%;
			background: #22d3ee;
			box-shadow: 0 0 7px rgba(34, 211, 238, 0.72);
		}
	`,
})
export class AreaPanelOcclusionScene {
	mode = input<HtmlOcclusionMode>('analytic');

	protected readonly expanded = signal(false);
	protected readonly samples = AREA_SAMPLES;
	private readonly metrics = inject(HtmlOcclusionMetrics);
	private readonly occluderRef = viewChild<ElementRef<Mesh>>('occluder');
	private readonly strategy = new AreaOcclusionStrategy(() => this.occluderRef()?.nativeElement, this.metrics);
	protected readonly occlusion = computed(() => (this.mode() === 'analytic' ? this.strategy : true));

	constructor() {
		beforeRender(({ clock }) => {
			const occluder = this.occluderRef()?.nativeElement;
			if (!occluder) return;
			occluder.position.x = Math.sin(clock.elapsedTime * 0.62) * 2.25;
			occluder.rotation.y = Math.sin(clock.elapsedTime * 0.37) * 0.12;
			occluder.updateMatrixWorld();
		});
	}

	protected toggleSize() {
		this.expanded.update((expanded) => !expanded);
	}
}
