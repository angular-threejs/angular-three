import {
	ChangeDetectionStrategy,
	Component,
	afterNextRender,
	createEnvironmentInjector,
	signal,
	untracked,
} from '@angular/core';
import { NgxResize, ResizeOptions, ResizeResult, provideResizeOptions } from 'ngxtension/resize';
import { NgtCanvasHandler } from './canvas-handler';
import { NgtDomEvent } from './events';
import { provideNgtRenderer } from './renderer';
import { provideStore } from './store';
import { is } from './utils/is';

@Component({
	selector: 'ngt-canvas',
	standalone: true,
	template: `
		<div (ngxResize)="resizeResult.set($event)" style="height: 100%; width: 100%;">
			<canvas #glCanvas style="display: block;"></canvas>
		</div>
	`,
	imports: [NgxResize],
	providers: [
		provideResizeOptions({
			emitInZone: false,
			emitInitialResult: true,
			debounce: { scroll: 50, resize: 0 },
		} as ResizeOptions),
		provideStore(),
	],
	host: {
		style: 'display: block;position: relative;width: 100%;height: 100%;overflow: hidden;',
		'[style.pointerEvents]': 'hbPointerEvents()',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtCanvas extends NgtCanvasHandler {
	// NOTE: this signal is updated outside of Zone
	protected resizeResult = signal<ResizeResult>({} as ResizeResult, { equal: Object.is });

	constructor() {
		super();
		afterNextRender(() => {
			this.zone.runOutsideAngular(() => {
				this.configurator = this.initRoot(this.glCanvas().nativeElement);
				this.noZoneResizeEffect();
			});
		});
	}

	private noZoneResizeEffect() {
		this.autoEffect(() => {
			const resizeResult = this.resizeResult();
			if (resizeResult.width > 0 && resizeResult.height > 0) {
				if (!this.configurator) this.configurator = this.initRoot(this.glCanvas().nativeElement);
				this.configurator.configure({
					gl: this.gl(),
					shadows: this.shadows(),
					legacy: this.legacy(),
					linear: this.linear(),
					flat: this.flat(),
					orthographic: this.orthographic(),
					frameloop: this.frameloop(),
					performance: this.performance(),
					dpr: this.dpr(),
					raycaster: this.raycaster(),
					scene: this.scene(),
					camera: this.camera(),
					events: this.events(),
					eventSource: this.eventSource(),
					eventPrefix: this.eventPrefix(),
					lookAt: this.lookAt(),
					size: resizeResult,
				});

				untracked(() => {
					if (this.glRef) {
						this.glRef.changeDetectorRef.detectChanges();
					} else {
						this.noZoneRender();
					}
				});
			}
		});
	}

	private noZoneRender() {
		// NOTE: destroy previous instances if existed
		this.glEnvironmentInjector?.destroy();
		this.glRef?.destroy();

		// NOTE: Flag the canvas active, rendering will now begin
		this.store.update((state) => ({ internal: { ...state.internal, active: true } }));

		const [state, eventSource, eventPrefix] = [
			this.store.snapshot,
			untracked(this.eventSource),
			untracked(this.eventPrefix),
		];

		// connect to event source
		state.events.connect?.(
			eventSource ? (is.ref(eventSource) ? eventSource.nativeElement : eventSource) : this.host.nativeElement,
		);

		// setup compute for eventPrefix
		if (eventPrefix) {
			state.setEvents({
				compute: (event, store) => {
					const { pointer, raycaster, camera, size } = store.snapshot;
					const x = event[(eventPrefix + 'X') as keyof NgtDomEvent] as number;
					const y = event[(eventPrefix + 'Y') as keyof NgtDomEvent] as number;
					pointer.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
					raycaster.setFromCamera(pointer, camera);
				},
			});
		}

		// emit created event if observed
		this.created.emit(this.store.snapshot);

		if (!this.store.get('events', 'connected')) {
			this.store.get('events').connect?.(untracked(this.glCanvas).nativeElement);
		}

		untracked(() => {
			this.glEnvironmentInjector = createEnvironmentInjector(
				[provideNgtRenderer(this.store)],
				this.environmentInjector,
			);
			this.glRef = this.viewContainerRef.createComponent(untracked(this.sceneGraph), {
				environmentInjector: this.glEnvironmentInjector,
				injector: this.injector,
			});

			this.glRef.changeDetectorRef.detectChanges();
		});
	}
}
