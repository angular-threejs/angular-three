import { CUSTOM_ELEMENTS_SCHEMA, ENVIRONMENT_INITIALIZER, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
	getLocalState,
	injectCanvasRootInitializer,
	NGT_STORE,
	NgtAnyRecord,
	NgtCanvasOptions,
	NgtEventHandlers,
	NgtInstanceNode,
	NgtSignalStore,
	NgtState,
	provideStore,
} from 'angular-three';
import { Object3D } from 'three';
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
			mockCanvasOptions = {},
			canvasConfiguration = {},
			errorOnUnknownElements,
			providers,
			declarations,
			imports,
			teardown,
			deferBlockBehavior,
		}: {
			mockCanvasOptions?: { width?: number; height?: number; beforeReturn?: (canvas: HTMLCanvasElement) => void };
			canvasConfiguration?: Partial<Omit<NgtCanvasOptions, 'frameloop' | 'size' | 'events'>>;
		} & Omit<Parameters<TestBed['configureTestingModule']>[0], 'schemas'> = {},
	) {
		const mockedCanvas = createMockCanvas(mockCanvasOptions);

		const fixture = TestBed.configureTestingModule({
			providers: [
				provideStore(),
				{
					provide: ENVIRONMENT_INITIALIZER,
					useFactory: () => {
						const initRoot = injectCanvasRootInitializer();

						return () => {
							const configurator = initRoot(mockedCanvas);
							configurator.configure({
								frameloop: 'never',
								size: {
									width: mockCanvasOptions.width ?? 1280,
									height: mockCanvasOptions.height ?? 800,
									top: 0,
									left: 0,
								},
								...canvasConfiguration,
								events: undefined,
							});
						};
					},
					multi: true,
				},
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
		fixture.detectChanges();

		const store = TestBed.inject(NGT_STORE);

		TestBed.flushEffects();

		return {
			store,
			fixture,
			scene: store.snapshot.scene,
			sceneInstanceNode: getLocalState(store.snapshot.scene)!,
			canvas: mockedCanvas,
			destroy: fixture.componentInstance.destroy.bind(fixture.componentInstance),
			fireEvent: this.createEventFirer(store, fixture),
			advance: this.createAdvance(store),
			toGraph: this.createToGraph(store),
		};
	}

	static createToGraph(store: NgtSignalStore<NgtState>) {
		function graphify(type: string, name: string, children: NgtTestGraphedObject[]): NgtTestGraphedObject {
			return { type, name, children };
		}

		function toGraph(node: Object3D): NgtTestGraphedObject[] {
			return node.children.map((child) => graphify(child.type, child.name || '', toGraph(child)));
		}

		return () => {
			const state = store.snapshot;
			return toGraph(state.scene);
		};
	}

	static createAdvance(store: NgtSignalStore<NgtState>) {
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

	static createEventFirer(store: NgtSignalStore<NgtState>, fixture: ComponentFixture<NgtTestCanvas>) {
		let autoDetectChanges = true;

		async function fireEvent(el: NgtInstanceNode, eventName: keyof NgtEventHandlers, eventData: NgtAnyRecord = {}) {
			const localState = getLocalState(el);
			if (!localState) {
				console.warn(`[NGT Test] ${el} has no local state`);
				return;
			}

			const handler = localState.handlers[eventName];
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
