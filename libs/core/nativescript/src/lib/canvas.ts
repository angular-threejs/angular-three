import '@nativescript/canvas-three';

import { DOCUMENT } from '@angular/common';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	ComponentRef,
	createEnvironmentInjector,
	DestroyRef,
	EnvironmentInjector,
	inject,
	Injector,
	input,
	NgZone,
	NO_ERRORS_SCHEMA,
	output,
	Type,
	untracked,
	viewChild,
	ViewContainerRef,
} from '@angular/core';
import { registerElement } from '@nativescript/angular';
import { Canvas } from '@nativescript/canvas';
import {
	injectCanvasRootInitializer,
	injectStore,
	makeDpr,
	NgtCanvasConfigurator,
	NgtCanvasOptions,
	NgtDpr,
	NgtGLOptions,
	NgtPerformance,
	NgtRoutedScene,
	NgtSize,
	NgtState,
	provideNgtRenderer,
	provideStore,
} from 'angular-three';
import { Raycaster, Scene, Vector3, WebGLRenderer } from 'three';

registerElement('Canvas', () => Canvas);

@Component({
	selector: 'NgtCanvas',
	standalone: true,
	template: `
		<GridLayout>
			<Canvas #canvas style="width: 100%; height: auto" (ready)="onReady($event)"></Canvas>
		</GridLayout>
	`,
	providers: [{ provide: DOCUMENT, useValue: document }, provideStore()],
	schemas: [NO_ERRORS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtCanvasNative {
	sceneGraph = input.required<Type<any>, Type<any> | 'routed'>({
		transform: (value) => {
			if (value === 'routed') return NgtRoutedScene;
			return value;
		},
	});
	gl = input<NgtGLOptions>();
	size = input<NgtSize>();
	shadows = input(false, {
		transform: (value) => {
			if (value === '') return booleanAttribute(value);
			return value as NonNullable<NgtCanvasOptions['shadows']>;
		},
	});
	legacy = input(false, { transform: booleanAttribute });
	linear = input(false, { transform: booleanAttribute });
	flat = input(false, { transform: booleanAttribute });
	orthographic = input(false, { transform: booleanAttribute });
	frameloop = input<NonNullable<NgtCanvasOptions['frameloop']>>('always');
	performance = input<Partial<Omit<NgtPerformance, 'regress'>>>();
	dpr = input<NgtDpr>([1, 2]);
	raycaster = input<Partial<Raycaster>>();
	scene = input<Scene | Partial<Scene>>();
	camera = input<NonNullable<NgtCanvasOptions['camera']>>();
	lookAt = input<Vector3 | Parameters<Vector3['set']>>();
	created = output<NgtState>();

	private store = injectStore();
	private initRoot = injectCanvasRootInitializer();
	private injector = inject(Injector);
	private environmentInjector = inject(EnvironmentInjector);
	private destroyRef = inject(DestroyRef);
	private zone = inject(NgZone);

	private canvasViewContainerRef = viewChild.required('canvas', { read: ViewContainerRef });

	private configurator?: NgtCanvasConfigurator;
	private glEnvironmentInjector?: EnvironmentInjector;
	private glRef?: ComponentRef<any>;

	constructor() {
		this.destroyRef.onDestroy(() => {
			this.glRef?.destroy();
			this.glEnvironmentInjector?.destroy();
			this.configurator?.destroy();
		});
	}

	onReady(event: any) {
		const canvas = event.object;
		const dpr = makeDpr(untracked(this.dpr), window);
		const canvasWidth = canvas.clientWidth * dpr;
		const canvasHeight = canvas.clientHeight * dpr;
		Object.assign(canvas, { width: canvasWidth, height: canvasHeight });

		const context = canvas.getContext('webgl2');
		const gl = new WebGLRenderer({
			canvas,
			context: context as unknown as WebGLRenderingContext,
			powerPreference: 'high-performance',
			antialias: true,
			alpha: true,
			...untracked(this.gl),
		});
		gl.setSize(canvasWidth, canvasHeight);

		this.zone.runOutsideAngular(() => {
			this.configurator = this.initRoot(canvas);
			this.configurator.configure({
				gl,
				size: { width: canvasWidth, height: canvasHeight, top: 0, left: 0 },
				shadows: untracked(this.shadows),
				legacy: untracked(this.legacy),
				linear: untracked(this.linear),
				flat: untracked(this.flat),
				orthographic: untracked(this.orthographic),
				frameloop: untracked(this.frameloop),
				performance: untracked(this.performance),
				dpr: untracked(this.dpr),
				raycaster: untracked(this.raycaster),
				scene: untracked(this.scene),
				camera: untracked(this.camera),
				lookAt: untracked(this.lookAt),
			});
			untracked(this.noZoneRender.bind(this));
		});
	}

	private noZoneRender() {
		// NOTE: destroy previous instances if existed
		this.glEnvironmentInjector?.destroy();
		this.glRef?.destroy();

		// NOTE: Flag the canvas active, rendering will now begin
		this.store.update((state) => ({ internal: { ...state.internal, active: true } }));

		// emit created event if observed
		this.created.emit(this.store.snapshot);

		this.glEnvironmentInjector = createEnvironmentInjector(
			[{ provide: DOCUMENT, useValue: document }, provideNgtRenderer(this.store)],
			this.environmentInjector,
		);
		this.glRef = untracked(this.canvasViewContainerRef).createComponent(untracked(this.sceneGraph), {
			environmentInjector: this.glEnvironmentInjector,
			injector: this.injector,
		});

		this.glRef.changeDetectorRef.detectChanges();
	}
}
