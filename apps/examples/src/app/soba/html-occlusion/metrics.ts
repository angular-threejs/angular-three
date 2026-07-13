import { Injectable, signal } from '@angular/core';

export type HtmlOcclusionMode = 'analytic' | 'raycast';
export type HtmlOcclusionSubject = 'sphere' | 'spaceship' | 'panel';

export interface HtmlOcclusionMetricsSnapshot {
	readonly fps: number | null;
	readonly averageFrameMs: number | null;
	readonly p95FrameMs: number | null;
	readonly occlusionCpuMs: number | null;
	readonly checksPerFrame: number | null;
	readonly sampledFrames: number;
}

export type HtmlOcclusionMetricSamples = Record<HtmlOcclusionMode, HtmlOcclusionMetricsSnapshot>;

const initialSnapshot: HtmlOcclusionMetricsSnapshot = {
	fps: null,
	averageFrameMs: null,
	p95FrameMs: null,
	occlusionCpuMs: null,
	checksPerFrame: null,
	sampledFrames: 0,
};

@Injectable()
export class HtmlOcclusionMetrics {
	readonly snapshots = signal<HtmlOcclusionMetricSamples>({
		analytic: initialSnapshot,
		raycast: initialSnapshot,
	});

	private activeMode: HtmlOcclusionMode = 'analytic';
	private frameDurations: number[] = [];
	private occlusionDurationTotal = 0;
	private occlusionChecks = 0;
	private customStartedAt = 0;
	private expectedCustomChecks = 0;
	private completedCustomChecks = 0;
	private lastPublishedAt = performance.now();
	private generation = 0;

	selectMode(mode: HtmlOcclusionMode) {
		if (this.activeMode === mode) return;
		this.activeMode = mode;
		this.resetWindow();
	}

	resetAll() {
		this.resetWindow();
		this.snapshots.set({ analytic: initialSnapshot, raycast: initialSnapshot });
	}

	beginCustomFrame(expectedChecks: number) {
		if (this.activeMode !== 'analytic') return;
		this.customStartedAt = performance.now();
		this.expectedCustomChecks = expectedChecks;
		this.completedCustomChecks = 0;
	}

	recordCustomResult(occluded: boolean) {
		if (this.activeMode !== 'analytic' || !this.expectedCustomChecks) return occluded;

		this.completedCustomChecks++;
		if (this.completedCustomChecks === this.expectedCustomChecks) {
			this.occlusionDurationTotal += performance.now() - this.customStartedAt;
			this.occlusionChecks += this.completedCustomChecks;
			this.expectedCustomChecks = 0;
		}

		return occluded;
	}

	recordDefaultRaycast(duration: number) {
		if (this.activeMode !== 'raycast' || !Number.isFinite(duration) || duration < 0) return;
		this.occlusionDurationTotal += duration;
		this.occlusionChecks++;
	}

	recordFrame(delta: number) {
		if (!Number.isFinite(delta) || delta <= 0) return;
		this.frameDurations.push(delta * 1000);

		const now = performance.now();
		if (now - this.lastPublishedAt < 500) return;
		this.lastPublishedAt = now;

		const sampledFrames = this.frameDurations.length;
		const averageFrameMs = this.frameDurations.reduce((total, duration) => total + duration, 0) / sampledFrames;
		const sortedDurations = [...this.frameDurations].sort((left, right) => left - right);
		const p95Index = Math.max(0, Math.ceil(sampledFrames * 0.95) - 1);
		const generation = this.generation;
		const mode = this.activeMode;

		const snapshot: HtmlOcclusionMetricsSnapshot = {
			fps: Math.round(1000 / averageFrameMs),
			averageFrameMs: Number(averageFrameMs.toFixed(1)),
			p95FrameMs: Number(sortedDurations[p95Index]!.toFixed(1)),
			occlusionCpuMs: Number((this.occlusionDurationTotal / sampledFrames).toFixed(3)),
			checksPerFrame: Number((this.occlusionChecks / sampledFrames).toFixed(1)),
			sampledFrames,
		};

		this.clearCounters();
		queueMicrotask(() => {
			if (generation !== this.generation) return;
			this.snapshots.update((samples) => ({ ...samples, [mode]: snapshot }));
		});
	}

	private resetWindow() {
		this.generation++;
		this.clearCounters();
		this.lastPublishedAt = performance.now();
	}

	private clearCounters() {
		this.frameDurations = [];
		this.occlusionDurationTotal = 0;
		this.occlusionChecks = 0;
		this.customStartedAt = 0;
		this.expectedCustomChecks = 0;
		this.completedCustomChecks = 0;
	}
}
