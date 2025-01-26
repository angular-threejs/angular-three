import {
	ComponentRef,
	CUSTOM_ELEMENTS_SCHEMA,
	provideEnvironmentInitializer,
	RendererFactory2,
	Type,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import {
	getInstanceState,
	injectCanvasRootInitializer,
	NGT_STORE,
	type NgtAnyRecord,
	type NgtCanvasOptions,
	type NgtEventHandlers,
	type NgtInstanceNode,
	NgtRendererFactory2,
	type NgtState,
	type SignalState,
	storeFactory,
} from 'angular-three';
import type * as THREE from 'three';
import { NgtTestCanvas } from './test-canvas';
import { createMockCanvas } from './utils/mock-canvas';

export interface NgtTestGraphedObject {
	type: string;
	name: string;
	children: NgtTestGraphedObject[];
}

export class NgtTestBed {
	static create<T extends Type<any>>(
		sceneGraph: T,
		{
			sceneGraphInputs = {},
			mockCanvasOptions = {},
			canvasConfiguration = {},
			errorOnUnknownElements,
			providers,
			declarations,
			imports,
			teardown,
			deferBlockBehavior,
		}: {
			sceneGraphInputs?: NgtAnyRecord;
			mockCanvasOptions?: { width?: number; height?: number; beforeReturn?: (canvas: HTMLCanvasElement) => void };
			canvasConfiguration?: Partial<Omit<NgtCanvasOptions, 'frameloop' | 'size' | 'events'>>;
		} & Omit<Parameters<TestBed['configureTestingModule']>[0], 'schemas'> = {},
	) {
		const mockedCanvas = createMockCanvas(mockCanvasOptions);

		const fixture = TestBed.configureTestingModule({
			providers: [
				{
					provide: RendererFactory2,
					useFactory: (delegate: RendererFactory2) => new NgtRendererFactory2(delegate),
					deps: [DomRendererFactory2],
				},
				{ provide: NGT_STORE, useFactory: storeFactory },
				provideEnvironmentInitializer(() => {
					const initializerFn = (() => {
						const initRoot = injectCanvasRootInitializer();

						return () => {
							const configurator = initRoot(mockedCanvas);
							configurator.configure({
								...canvasConfiguration,
								events: undefined,
								frameloop: 'never',
								size: {
									width: mockCanvasOptions.width ?? mockedCanvas.width ?? 1280,
									height: mockCanvasOptions.height ?? mockedCanvas.height ?? 800,
									top: 0,
									left: 0,
								},
							});
						};
					})();
					return initializerFn();
				}),
				...(providers ?? []),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			errorOnUnknownElements: errorOnUnknownElements ?? false,
			declarations,
			imports,
			teardown,
			deferBlockBehavior,
		}).createComponent(NgtTestCanvas);

		fixture.componentRef.setInput('sceneGraph', sceneGraph);
		fixture.componentRef.setInput('sceneGraphInputs', sceneGraphInputs);
		fixture.detectChanges();

		const store = TestBed.inject(NGT_STORE);

		TestBed.flushEffects();

		return {
			store,
			fixture,
			sceneGraphComponentRef: fixture.componentInstance.sceneRef as ComponentRef<T>,
			scene: store.snapshot.scene,
			sceneInstanceNode: getInstanceState(store.snapshot.scene)!,
			canvas: mockedCanvas,
			destroy: fixture.componentInstance.destroy.bind(fixture.componentInstance),
			fireEvent: this.createEventFirer(store, fixture),
			advance: this.createAdvance(store),
			toGraph: this.createToGraph(store),
		};
	}

	static createToGraph(store: SignalState<NgtState>) {
		function graphify(type: string, name: string, children: NgtTestGraphedObject[]): NgtTestGraphedObject {
			return { type, name, children };
		}

		function toGraph(node: THREE.Object3D): NgtTestGraphedObject[] {
			return node.children.map((child) => graphify(child.type, child.name || '', toGraph(child)));
		}

		return () => {
			const state = store.snapshot;
			return toGraph(state.scene);
		};
	}

	static createAdvance(store: SignalState<NgtState>) {
		return async (frames: number, delta: number | number[] = 1) => {
			const state = store.snapshot;
			const subscribers = state.internal.subscribers;

			const promises: Promise<void>[] = [];

			for (const subscriber of subscribers) {
				for (let i = 0; i < frames; i++) {
					if (Array.isArray(delta)) {
						promises.push(
							new Promise((res) => {
								subscriber.callback({ ...state, delta: delta[i] || delta[-1] });
								res();
							}),
						);
					} else {
						promises.push(
							new Promise((res) => {
								subscriber.callback({ ...state, delta });
								res();
							}),
						);
					}
				}
			}

			await Promise.all(promises);
		};
	}

	static createEventFirer(store: SignalState<NgtState>, fixture: ComponentFixture<NgtTestCanvas>) {
		let autoDetectChanges = true;

		async function fireEvent(el: NgtInstanceNode, eventName: keyof NgtEventHandlers, eventData: NgtAnyRecord = {}) {
			const instanceState = getInstanceState(el);
			if (!instanceState) {
				console.warn(`[NGT Test] ${el} has no local state`);
				return;
			}

			const handler = instanceState.handlers[eventName];
			if (!handler) {
				console.warn(`[NGT Test] ${el} has no ${eventName} handler`);
				return;
			}

			const raycastEvent = {
				camera: store.snapshot.camera,
				stopPropagation: () => {},
				target: el,
				currentTarget: el,
				sourceEvent: eventData,
				nativeEvent: eventData,
				object: el,
				eventObject: el,
				...eventData,
			};

			const result = await handler(raycastEvent as any);

			if (autoDetectChanges) {
				fixture.detectChanges();
			}

			return result;
		}

		fireEvent.setAutoDetectChanges = (auto: boolean) => {
			autoDetectChanges = auto;
		};

		return fireEvent;
	}
}
