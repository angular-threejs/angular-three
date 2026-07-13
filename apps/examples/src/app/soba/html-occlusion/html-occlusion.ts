import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { HtmlOcclusionMetrics, type HtmlOcclusionMode, type HtmlOcclusionSubject } from './metrics';
import { SceneGraph } from './scene';
import type { SpaceshipLabelCount } from './spaceship';

type MarkerCount = 64 | 128 | 256;

@Component({
	template: `
		@let samples = metrics();
		@let comparison = kernelComparison();
		<aside
			class="benchmark-panel"
			[class.is-mobile-expanded]="mobilePanelExpanded()"
			aria-label="HTML occlusion performance"
		>
			<header class="benchmark-header">
				<div>
					<div class="eyebrow">HTML occlusion lab</div>
					<h1>{{ subjectTitle() }}</h1>
				</div>
				<div class="benchmark-actions">
					<span class="live-status">
						<span aria-hidden="true"></span>
						Live
					</span>
					<button
						type="button"
						class="panel-toggle"
						[attr.aria-expanded]="mobilePanelExpanded()"
						(click)="toggleMobilePanel()"
					>
						{{ mobilePanelExpanded() ? 'Hide controls' : 'Show controls' }}
					</button>
				</div>
			</header>

			<div class="subject-switch" role="group" aria-label="Occlusion scene">
				<button
					type="button"
					[class.is-active]="subject() === 'sphere'"
					[attr.aria-pressed]="subject() === 'sphere'"
					(click)="selectSubject('sphere')"
				>
					Sphere field
				</button>
				<button
					type="button"
					[class.is-active]="subject() === 'spaceship'"
					[attr.aria-pressed]="subject() === 'spaceship'"
					(click)="selectSubject('spaceship')"
				>
					GLB spacecraft
				</button>
				<button
					type="button"
					[class.is-active]="subject() === 'panel'"
					[attr.aria-pressed]="subject() === 'panel'"
					(click)="selectSubject('panel')"
				>
					DOM panel
				</button>
			</div>

			<p class="benchmark-description">
				@if (subject() === 'sphere') {
					Compare one shared analytical pass with NgtsHTML's default scene raycasts while the camera moves.
				} @else if (subject() === 'spaceship') {
					Compare exact cached-BVH occlusion for a GLB mesh with NgtsHTML's default scene raycasts.
				} @else {
					See how setupTarget observes a resizable HTML panel while beginFrame and isOccluded only process
					eligible targets.
				}
			</p>

			<div class="mode-switch" role="group" aria-label="Occlusion algorithm">
				<button
					type="button"
					[class.is-active]="mode() === 'analytic'"
					[attr.aria-pressed]="mode() === 'analytic'"
					(click)="selectMode('analytic')"
				>
					Custom strategy
				</button>
				<button
					type="button"
					[class.is-active]="mode() === 'raycast'"
					[attr.aria-pressed]="mode() === 'raycast'"
					(click)="selectMode('raycast')"
				>
					Default raycast
				</button>
			</div>

			@if (subject() !== 'panel') {
				<div class="comparison-shell" aria-live="polite">
					<table class="comparison-table">
						<caption>Latest measured sample for each occlusion mode</caption>
						<thead>
							<tr>
								<th scope="col">Measured</th>
								<th scope="col" [class.is-active]="mode() === 'analytic'">Custom</th>
								<th scope="col" [class.is-active]="mode() === 'raycast'">Default</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th scope="row">FPS</th>
								<td [class.is-active]="mode() === 'analytic'">{{ samples.analytic.fps ?? '—' }}</td>
								<td [class.is-active]="mode() === 'raycast'">{{ samples.raycast.fps ?? '—' }}</td>
							</tr>
							<tr>
								<th scope="row">Average frame</th>
								<td [class.is-active]="mode() === 'analytic'">
									{{ samples.analytic.averageFrameMs ?? '—' }}
									<small>ms</small>
								</td>
								<td [class.is-active]="mode() === 'raycast'">
									{{ samples.raycast.averageFrameMs ?? '—' }}
									<small>ms</small>
								</td>
							</tr>
							<tr>
								<th scope="row">P95 frame</th>
								<td [class.is-active]="mode() === 'analytic'">
									{{ samples.analytic.p95FrameMs ?? '—' }}
									<small>ms</small>
								</td>
								<td [class.is-active]="mode() === 'raycast'">
									{{ samples.raycast.p95FrameMs ?? '—' }}
									<small>ms</small>
								</td>
							</tr>
							<tr class="key-metric">
								<th scope="row">Occlusion kernel</th>
								<td [class.is-active]="mode() === 'analytic'">
									{{ samples.analytic.occlusionCpuMs ?? '—' }}
									<small>ms/frame</small>
								</td>
								<td [class.is-active]="mode() === 'raycast'">
									{{ samples.raycast.occlusionCpuMs ?? '—' }}
									<small>ms/frame</small>
								</td>
							</tr>
							<tr class="key-metric">
								<th scope="row">60 Hz budget</th>
								<td [class.is-active]="mode() === 'analytic'">
									{{ frameBudget(samples.analytic.occlusionCpuMs) }}
								</td>
								<td [class.is-active]="mode() === 'raycast'">
									{{ frameBudget(samples.raycast.occlusionCpuMs) }}
								</td>
							</tr>
							<tr>
								<th scope="row">Checks</th>
								<td [class.is-active]="mode() === 'analytic'">
									{{ samples.analytic.checksPerFrame ?? '—' }}
									<small>/frame</small>
								</td>
								<td [class.is-active]="mode() === 'raycast'">
									{{ samples.raycast.checksPerFrame ?? '—' }}
									<small>/frame</small>
								</td>
							</tr>
							<tr>
								<th scope="row">Sample size</th>
								<td [class.is-active]="mode() === 'analytic'">
									{{ samples.analytic.sampledFrames || '—' }}
									<small>frames</small>
								</td>
								<td [class.is-active]="mode() === 'raycast'">
									{{ samples.raycast.sampledFrames || '—' }}
									<small>frames</small>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				@if (comparison) {
					<div class="result-callout">
						<span>Default / custom kernel</span>
						<strong>{{ comparison.ratio }}× CPU ratio</strong>
						<small>
							{{ comparison.analyticBudget }}% vs {{ comparison.raycastBudget }}% of a 60 Hz frame
						</small>
					</div>
				}
			} @else {
				<div class="lifecycle-shell" aria-label="Custom strategy lifecycle">
					<div>
						<span>1</span>
						<p>
							<strong>setupTarget()</strong>
							<small>Observe the card once and cache its live size.</small>
						</p>
					</div>
					<div>
						<span>2</span>
						<p>
							<strong>beginFrame()</strong>
							<small>Capture shared camera and canvas state.</small>
						</p>
					</div>
					<div>
						<span>3</span>
						<p>
							<strong>isOccluded()</strong>
							<small>Test nine points across the measured card.</small>
						</p>
					</div>
					<div>
						<span>4</span>
						<p>
							<strong>teardown</strong>
							<small>Stop observing when the strategy changes or target leaves.</small>
						</p>
					</div>
				</div>
			}

			@if (subject() === 'sphere') {
				<div class="workload">
					<div>
						<span>Marker load</span>
						<small>All markers are labeled DOM nodes</small>
					</div>
					<div class="load-switch" role="group" aria-label="Marker count">
						@for (count of markerCounts; track count) {
							<button
								type="button"
								[class.is-active]="markerCount() === count"
								[attr.aria-pressed]="markerCount() === count"
								(click)="selectMarkerCount(count)"
							>
								{{ count }}
							</button>
						}
					</div>
				</div>
			} @else if (subject() === 'spaceship') {
				<div class="workload">
					<div>
						<span>Spacecraft labels</span>
						<small>
							{{ spaceshipLabelCount() === 6 ? 'Named systems' : 'Surface-sampled hull telemetry' }}
						</small>
					</div>
					<div class="load-switch is-spacecraft" role="group" aria-label="Spacecraft label count">
						@for (count of spaceshipLabelCounts; track count) {
							<button
								type="button"
								[class.is-active]="spaceshipLabelCount() === count"
								[attr.aria-pressed]="spaceshipLabelCount() === count"
								(click)="selectSpaceshipLabelCount(count)"
							>
								{{ count }}
							</button>
						}
					</div>
				</div>
			} @else {
				<div class="workload">
					<div>
						<span>Custom target test</span>
						<small>
							{{
								mode() === 'analytic'
									? 'Switch without recreating the strategy or observer'
									: 'Default raycast always checks the anchor'
							}}
						</small>
					</div>
					@if (mode() === 'analytic') {
						<div class="load-switch is-panel" role="group" aria-label="Custom panel occlusion samples">
							<button
								type="button"
								[class.is-active]="!panelCenterOnly()"
								[attr.aria-pressed]="!panelCenterOnly()"
								(click)="selectPanelCenterOnly(false)"
							>
								Area · 9
							</button>
							<button
								type="button"
								[class.is-active]="panelCenterOnly()"
								[attr.aria-pressed]="panelCenterOnly()"
								(click)="selectPanelCenterOnly(true)"
							>
								Center · 1
							</button>
						</div>
					} @else {
						<span class="workload-badge">Center anchor · built-in</span>
					}
				</div>
			}

			<div class="algorithm-summary" aria-label="Selected occlusion method">
				<div>
					<span>Path</span>
					<strong>{{ mode() === 'analytic' ? 'Custom strategy' : 'NgtsHTML default' }}</strong>
				</div>
				<div>
					<span>Occluders</span>
					<strong>
						{{
							mode() === 'raycast'
								? 'Entire scene'
								: subject() === 'sphere'
									? 'Known sphere'
									: subject() === 'spaceship'
										? 'GLB mesh hierarchy'
										: 'Moving box'
						}}
					</strong>
				</div>
				<div>
					<span>Per eligible target</span>
					<strong>
						{{
							mode() === 'raycast'
								? 'Recursive raycast'
								: subject() === 'sphere'
									? 'Segment / sphere test'
									: subject() === 'spaceship'
										? 'BVH triangle ray'
										: panelCenterOnly()
											? '1 center sample'
											: '3 × 3 area samples'
						}}
					</strong>
				</div>
				<div>
					<span>Shared frame setup</span>
					<strong>
						{{
							mode() === 'raycast'
								? 'None'
								: subject() === 'sphere'
									? 'Camera + sphere'
									: subject() === 'spaceship'
										? 'Camera + cached BVHs'
										: 'Camera + canvas size'
						}}
					</strong>
				</div>
				<div>
					<span>Target setup</span>
					<strong>
						{{ mode() === 'analytic' && subject() === 'panel' ? 'ResizeObserver' : 'None' }}
					</strong>
				</div>
			</div>

			@if (subject() === 'panel') {
				<p class="benchmark-note">
					Custom observes the card once and keeps its latest non-zero size. Area mode hides it only when all
					nine points are blocked; center mode checks one point without recreating the strategy. Default
					checks the card's 3D anchor. Switching custom/default runs the observer's teardown and setup again.
				</p>
			} @else {
				<p class="benchmark-note">
					Samples use 500 ms windows and remain visible for side-by-side comparison. The kernel measures
					custom frame setup + target tests versus default ray setup + recursive intersections. Changing scene
					or workload clears both samples. Spacecraft loads above 6 are deterministic, surface-sampled hull
					telemetry; the one-time sampling and BVH setup are excluded from steady-state frame cost.
				</p>
			}
		</aside>

		<ngt-canvas [camera]="{ position: [0, 1, 7], fov: 48 }">
			<app-html-occlusion-scene-graph
				*canvasContent
				[mode]="mode()"
				[subject]="subject()"
				[markerCount]="markerCount()"
				[panelCenterOnly]="panelCenterOnly()"
				[spaceshipLabelCount]="spaceshipLabelCount()"
			/>
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'html-occlusion-soba' },
	imports: [NgtCanvas, SceneGraph],
	providers: [HtmlOcclusionMetrics],
})
export default class HtmlOcclusion {
	protected readonly mode = signal<HtmlOcclusionMode>('analytic');
	protected readonly subject = signal<HtmlOcclusionSubject>('sphere');
	protected readonly subjectTitle = computed(() => {
		switch (this.subject()) {
			case 'sphere':
				return 'Sphere marker benchmark';
			case 'spaceship':
				return 'Spacecraft occlusion lab';
			case 'panel':
				return 'DOM area occlusion';
		}
	});
	protected readonly markerCounts: readonly MarkerCount[] = [64, 128, 256];
	protected readonly markerCount = signal<MarkerCount>(64);
	protected readonly mobilePanelExpanded = signal(false);
	protected readonly panelCenterOnly = signal(false);
	protected readonly spaceshipLabelCounts: readonly SpaceshipLabelCount[] = [6, 64, 128, 256];
	protected readonly spaceshipLabelCount = signal<SpaceshipLabelCount>(6);
	private readonly metricService = inject(HtmlOcclusionMetrics);
	protected readonly metrics = this.metricService.snapshots;
	protected readonly kernelComparison = computed(() => {
		const { analytic, raycast } = this.metrics();
		if (!analytic.occlusionCpuMs || !raycast.occlusionCpuMs) return null;
		return {
			ratio: Number((raycast.occlusionCpuMs / analytic.occlusionCpuMs).toFixed(1)),
			analyticBudget: Math.round((analytic.occlusionCpuMs / (1000 / 60)) * 100),
			raycastBudget: Math.round((raycast.occlusionCpuMs / (1000 / 60)) * 100),
		};
	});

	protected selectMode(mode: HtmlOcclusionMode) {
		if (this.mode() === mode) return;
		this.metricService.selectMode(mode);
		this.mode.set(mode);
	}

	protected selectSubject(subject: HtmlOcclusionSubject) {
		if (this.subject() === subject) return;
		this.metricService.resetAll();
		this.subject.set(subject);
	}

	protected selectMarkerCount(count: MarkerCount) {
		if (this.markerCount() === count) return;
		this.metricService.resetAll();
		this.markerCount.set(count);
	}

	protected selectSpaceshipLabelCount(count: SpaceshipLabelCount) {
		if (this.spaceshipLabelCount() === count) return;
		this.metricService.resetAll();
		this.spaceshipLabelCount.set(count);
	}

	protected selectPanelCenterOnly(centerOnly: boolean) {
		this.panelCenterOnly.set(centerOnly);
	}

	protected toggleMobilePanel() {
		this.mobilePanelExpanded.update((expanded) => !expanded);
	}

	protected frameBudget(duration: number | null) {
		return duration === null ? '—' : `${Math.round((duration / (1000 / 60)) * 100)}%`;
	}
}
