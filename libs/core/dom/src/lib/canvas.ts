import {
	afterNextRender,
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	DestroyRef,
	Directive,
	effect,
	ElementRef,
	EmbeddedViewRef,
	inject,
	Injector,
	input,
	NgZone,
	output,
	signal,
	TemplateRef,
	untracked,
	viewChild,
	ViewContainerRef,
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import {
	injectCanvasRootInitializer,
	injectStore,
	is,
	NGT_CANVAS_CONTENT_FLAG,
	NGT_STORE,
	NgtCamera,
	NgtCameraParameters,
	NgtCanvasConfigurator,
	NgtDomEvent,
	NgtDpr,
	NgtEventPrefix,
	NgtFrameloop,
	NgtGLOptions,
	NgtPerformance,
	NgtShadows,
	NgtSize,
	NgtState,
	NgtVector3,
	storeFactory,
} from 'angular-three';
import { NgxResize, provideResizeOptions, ResizeOptions, ResizeResult } from 'ngxtension/resize';
import * as THREE from 'three';
import { createPointerEvents } from './events';

@Directive({ selector: 'ng-template[canvasContent]' })
export class NgtCanvasContent {
	constructor() {
		const store = injectStore();
		const vcr = inject(ViewContainerRef);
		const commentNode = vcr.element.nativeElement;

		// NOTE: flag this canvasContent ng-template comment node as the start
		commentNode.data = NGT_CANVAS_CONTENT_FLAG;
		commentNode[NGT_CANVAS_CONTENT_FLAG] = store;
	}
}

@Component({
	selector: 'ngt-canvas',
	template: `
		<div (ngxResize)="resizeResult.set($event)" style="height: 100%; width: 100%;">
			<canvas #glCanvas style="display: block;"></canvas>
			<ng-content />
		</div>
	`,
	imports: [NgxResize],
	providers: [
		provideResizeOptions({
			emitInZone: false,
			emitInitialResult: true,
			debounce: { scroll: 50, resize: 0 },
		} as ResizeOptions),
		{ provide: NGT_STORE, useFactory: storeFactory },
	],
	host: {
		style: 'display: block;position: relative;width: 100%;height: 100%;overflow: hidden;',
		'[style.pointerEvents]': 'hbPointerEvents()',
		ngSkipHydration: 'true',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtCanvasImpl {
	private store = injectStore();
	private initRoot = injectCanvasRootInitializer();

	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private zone = inject(NgZone);
	private injector = inject(Injector);

	gl = input<NgtGLOptions>();
	size = input<NgtSize>();
	shadows = input(false, {
		transform: (value) => {
			if (value === '') return booleanAttribute(value);
			return value as NgtShadows;
		},
	});
	legacy = input(false, { transform: booleanAttribute });
	linear = input(false, { transform: booleanAttribute });
	flat = input(false, { transform: booleanAttribute });
	orthographic = input(false, { transform: booleanAttribute });
	frameloop = input<NgtFrameloop>('always');
	performance = input<Partial<Omit<NgtPerformance, 'regress'>>>();
	dpr = input<NgtDpr>([1, 2]);
	raycaster = input<Partial<THREE.Raycaster>>();
	scene = input<THREE.Scene | Partial<THREE.Scene>>();
	camera = input<NgtCamera | NgtCameraParameters>();
	events = input(createPointerEvents);
	eventSource = input<HTMLElement | ElementRef<HTMLElement>>();
	eventPrefix = input<NgtEventPrefix>('offset');
	lookAt = input<NgtVector3>();

	created = output<NgtState>();
	pointerMissed = outputFromObservable(this.store.snapshot.pointerMissed$);

	private glCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('glCanvas');
	private glCanvasViewContainerRef = viewChild.required('glCanvas', { read: ViewContainerRef });
	private canvasContentRef = contentChild.required(NgtCanvasContent, { read: TemplateRef });

	protected hbPointerEvents = computed(() => (this.eventSource() ? 'none' : 'auto'));

	// NOTE: this signal is updated outside of Zone
	protected resizeResult = signal<ResizeResult>({} as ResizeResult, { equal: Object.is });
	private configurator = signal<NgtCanvasConfigurator | null>(null);

	private glRef?: EmbeddedViewRef<unknown>;

	constructor() {
		// NOTE: this means that everything in NgtCanvas will be in afterNextRender.
		// this allows the content of NgtCanvas to use effect instead of afterNextRender
		afterNextRender(() => {
			const [canvasVcr, canvasElement, canvasContent] = [
				this.glCanvasViewContainerRef(),
				this.glCanvas().nativeElement,
				this.canvasContentRef(),
			];

			this.zone.runOutsideAngular(() => {
				this.configurator.set(this.initRoot(canvasElement));
			});

			effect(
				() => {
					const resizeResult = this.resizeResult();
					if (
						!resizeResult.width ||
						resizeResult.width <= 0 ||
						!resizeResult.height ||
						resizeResult.height <= 0
					)
						return;

					const configurator = this.configurator();
					if (!configurator) return;

					const canvasOptions = {
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
					};

					this.zone.runOutsideAngular(() => {
						configurator.configure(canvasOptions);

						if (this.glRef) {
							this.store.snapshot.invalidate();
							this.glRef.detectChanges();
						} else {
							this.noZoneRender(canvasElement, canvasVcr, canvasContent);
						}
					});
				},
				{ injector: this.injector },
			);
		});

		inject(DestroyRef).onDestroy(() => {
			this.glRef?.destroy();
			this.configurator()?.destroy();
		});
	}

	private noZoneRender(
		canvasElement: HTMLCanvasElement,
		canvasVcr: ViewContainerRef,
		canvasContent: TemplateRef<unknown>,
	) {
		// NOTE: destroy previous instances if existed
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

		this.created.emit(this.store.snapshot);

		if (!this.store.snapshot.events.connected) {
			this.store.snapshot.events.connect?.(canvasElement);
		}

		this.glRef = canvasVcr.createEmbeddedView(canvasContent, {}, { injector: this.injector });
		this.glRef.detectChanges();
	}
}

export const NgtCanvas = [NgtCanvasImpl, NgtCanvasContent] as const;
