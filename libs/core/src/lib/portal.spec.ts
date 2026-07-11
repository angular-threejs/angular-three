import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgtTestBed } from 'angular-three/testing';
import { Group, OrthographicCamera, PerspectiveCamera, Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { getInstanceState } from './instance';
import { NgtPortal, NgtPortalAutoRender, NgtPortalImpl, type NgtPortalState } from './portal';
import { injectStore } from './store';
import type { NgtState } from './types';
import type { SignalState } from './utils/signal-state';

describe('NgtPortal', () => {
	it('notifies portal-local invalidations while forwarding them to the parent', () => {
		let portalStore!: SignalState<NgtState>;

		@Component({ selector: 'portal-invalidation-probe', template: '' })
		class PortalInvalidationProbe {
			constructor() {
				portalStore = injectStore();
			}
		}

		@Component({
			template: `
				<ngt-portal [container]="container">
					<ng-template portalContent><portal-invalidation-probe /></ng-template>
				</ngt-portal>
			`,
			imports: [NgtPortal, PortalInvalidationProbe],
		})
		class SceneGraph {
			container = new Scene();
			portal = viewChild.required(NgtPortalImpl);
		}

		const { sceneGraphComponentRef, store } = NgtTestBed.create(SceneGraph);
		const parentInvalidate = vi.fn();
		store.update({ invalidate: parentInvalidate });
		TestBed.flushEffects();

		const portalInvalidated = vi.fn();
		const unsubscribe = sceneGraphComponentRef.instance.portal().onInvalidate(portalInvalidated);

		portalStore.snapshot.invalidate(2);
		expect(portalInvalidated).toHaveBeenCalledOnce();
		expect(parentInvalidate).toHaveBeenCalledWith(2);

		store.snapshot.invalidate();
		expect(portalInvalidated).toHaveBeenCalledOnce();

		unsubscribe();
		portalStore.snapshot.invalidate();
		expect(portalInvalidated).toHaveBeenCalledOnce();
		expect(parentInvalidate).toHaveBeenCalledTimes(3);
	});

	it('preserves a local camera projection until the portal overrides size', () => {
		let portalStore!: SignalState<NgtState>;
		const camera = new OrthographicCamera(-1, 1, 1, -1);

		@Component({ selector: 'portal-camera-probe', template: '' })
		class PortalCameraProbe {
			constructor() {
				portalStore = injectStore();
			}
		}

		@Component({
			template: `
				<ngt-portal [container]="container" [state]="portalState()">
					<ng-template portalContent><portal-camera-probe /></ng-template>
				</ngt-portal>
			`,
			imports: [NgtPortal, PortalCameraProbe],
		})
		class SceneGraph {
			container = new Scene();
			portalState = signal<Partial<NgtPortalState>>({ camera });
		}

		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);

		expect(portalStore.snapshot.camera).toBe(camera);
		expect([camera.left, camera.right, camera.top, camera.bottom]).toEqual([-1, 1, 1, -1]);

		sceneGraphComponentRef.instance.portalState.set({
			camera,
			size: { width: 200, height: 80, top: 0, left: 0 },
		});
		fixture.detectChanges();
		TestBed.flushEffects();

		expect([camera.left, camera.right, camera.top, camera.bottom]).toEqual([-100, 100, 40, -40]);
		fixture.destroy();
	});

	it('layers reactive parent, local, and declarative state while moving live content between containers', () => {
		let portalStore!: SignalState<NgtState>;
		let revealLateChild!: () => void;

		@Component({
			selector: 'portal-probe',
			template: `
				<ngt-group name="portal-child" />
				@if (showLateChild()) {
					<ngt-group name="late-portal-child" />
				}
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class PortalProbe {
			showLateChild = signal(false);

			constructor() {
				portalStore = injectStore();
				revealLateChild = () => this.showLateChild.set(true);
			}
		}

		const declarativeCamera = new PerspectiveCamera(40);
		@Component({
			template: `
				<ngt-group #firstContainer name="first" />
				<ngt-group #secondContainer name="second" />
				@if (showPortal()) {
					<ngt-portal [container]="useSecond() ? secondContainer : firstContainer" [state]="portalState()">
						<ng-template portalContent>
							<portal-probe />
						</ng-template>
					</ngt-portal>
				}
			`,
			imports: [NgtPortal, PortalProbe],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			showPortal = signal(true);
			useSecond = signal(false);
			portalState = signal<Partial<NgtPortalState>>({
				camera: declarativeCamera,
				events: { priority: 4 },
				size: { width: 100, height: 50, top: 1, left: 2 },
			});
		}

		const { fixture, scene, sceneGraphComponentRef, store } = NgtTestBed.create(SceneGraph);
		const first = scene.getObjectByName('first') as Group;
		const second = scene.getObjectByName('second') as Group;
		const child = first.getObjectByName('portal-child')!;

		expect(portalStore.snapshot.camera).toBe(declarativeCamera);
		expect(portalStore.snapshot.events.priority).toBe(4);
		expect(portalStore.snapshot.size).toEqual({ width: 100, height: 50, top: 1, left: 2 });
		expect(getInstanceState(first)?.store).toBe(portalStore);

		const inheritedCamera = new PerspectiveCamera(55);
		const inheritedPerformance = { ...store.snapshot.performance, current: 0.75 };
		store.update({ camera: inheritedCamera, performance: inheritedPerformance });
		TestBed.flushEffects();
		expect(portalStore.snapshot.camera).toBe(declarativeCamera);

		sceneGraphComponentRef.instance.portalState.set({
			flat: true,
			events: { priority: 7 },
			size: { width: 200, height: 80, top: 3, left: 4 },
		});
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(portalStore.snapshot.camera).toBe(inheritedCamera);
		expect(portalStore.snapshot.performance).toBe(inheritedPerformance);
		expect(portalStore.snapshot.flat).toBe(true);
		expect(portalStore.snapshot.events.priority).toBe(7);

		portalStore.snapshot.setEvents({ enabled: false });
		const localCamera = new PerspectiveCamera(65);
		portalStore.update({ camera: localCamera });
		TestBed.flushEffects();
		expect(portalStore.snapshot.camera).toBe(localCamera);
		expect(localCamera.aspect).toBe(2.5);
		expect(portalStore.snapshot.viewport.aspect).toBe(2.5);

		const nextParentCamera = new PerspectiveCamera(75);
		store.update({ camera: nextParentCamera });
		TestBed.flushEffects();
		expect(portalStore.snapshot.camera).toBe(localCamera);
		expect(portalStore.snapshot.events.enabled).toBe(false);

		const explicitCamera = new PerspectiveCamera(85);
		sceneGraphComponentRef.instance.portalState.set({ camera: explicitCamera });
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(portalStore.snapshot.camera).toBe(explicitCamera);
		sceneGraphComponentRef.instance.portalState.set({});
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(portalStore.snapshot.camera).toBe(localCamera);

		sceneGraphComponentRef.instance.useSecond.set(true);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(first.getObjectByName('portal-child')).toBeUndefined();
		expect(second.getObjectByName('portal-child')).toBe(child);
		expect(getInstanceState(first)?.store).toBe(store);
		expect(getInstanceState(second)?.store).toBe(portalStore);

		revealLateChild();
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(first.getObjectByName('late-portal-child')).toBeUndefined();
		expect(second.getObjectByName('late-portal-child')).toBeDefined();

		sceneGraphComponentRef.instance.showPortal.set(false);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(getInstanceState(second)?.store).toBe(store);
		fixture.destroy();
	});

	it('layers overlapping container ownership and restores it in either cleanup order', () => {
		let firstPortalStore!: SignalState<NgtState>;
		let secondPortalStore!: SignalState<NgtState>;
		let revealFirstChild!: () => void;

		@Component({
			selector: 'first-portal-probe',
			template: `
				@if (showChild()) {
					<ngt-group name="first-late-child" />
				}
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class FirstPortalProbe {
			showChild = signal(false);

			constructor() {
				firstPortalStore = injectStore();
				revealFirstChild = () => this.showChild.set(true);
			}
		}

		@Component({ selector: 'second-portal-probe', template: '' })
		class SecondPortalProbe {
			constructor() {
				secondPortalStore = injectStore();
			}
		}

		@Component({
			template: `
				<ngt-group #container name="shared" />
				@if (showFirst()) {
					<ngt-portal [container]="container">
						<ng-template portalContent><first-portal-probe /></ng-template>
					</ngt-portal>
				}
				@if (showSecond()) {
					<ngt-portal [container]="container">
						<ng-template portalContent><second-portal-probe /></ng-template>
					</ngt-portal>
				}
			`,
			imports: [NgtPortal, FirstPortalProbe, SecondPortalProbe],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			showFirst = signal(true);
			showSecond = signal(true);
		}

		const { fixture, scene, sceneGraphComponentRef, store } = NgtTestBed.create(SceneGraph);
		const container = scene.getObjectByName('shared') as Group;
		expect(getInstanceState(container)?.store).toBe(secondPortalStore);
		revealFirstChild();
		fixture.detectChanges();
		TestBed.flushEffects();
		const firstLateChild = container.getObjectByName('first-late-child')!;
		expect(firstLateChild).toBeDefined();
		expect(getInstanceState(firstLateChild)?.store).toBe(firstPortalStore);
		expect(getInstanceState(container)?.store).toBe(secondPortalStore);

		sceneGraphComponentRef.instance.showSecond.set(false);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(getInstanceState(container)?.store).toBe(firstPortalStore);

		sceneGraphComponentRef.instance.showSecond.set(true);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(getInstanceState(container)?.store).toBe(secondPortalStore);

		sceneGraphComponentRef.instance.showFirst.set(false);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(getInstanceState(container)?.store).toBe(secondPortalStore);

		sceneGraphComponentRef.instance.showSecond.set(false);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(getInstanceState(container)?.store).toBe(store);
		fixture.destroy();
	});

	it('restores a raw portal container to the parent store after teardown', () => {
		let portalStore!: SignalState<NgtState>;

		@Component({ selector: 'raw-portal-probe', template: '' })
		class RawPortalProbe {
			constructor() {
				portalStore = injectStore();
			}
		}

		@Component({
			template: `
				@if (showPortal()) {
					<ngt-portal [container]="rawContainer">
						<ng-template portalContent><raw-portal-probe /></ng-template>
					</ngt-portal>
				}
			`,
			imports: [NgtPortal, RawPortalProbe],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			showPortal = signal(true);
			rawContainer = new Group();
		}

		const { fixture, sceneGraphComponentRef, store } = NgtTestBed.create(SceneGraph);
		const rawContainer = sceneGraphComponentRef.instance.rawContainer;
		expect(getInstanceState(rawContainer)?.store).toBe(portalStore);

		sceneGraphComponentRef.instance.showPortal.set(false);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(getInstanceState(rawContainer)?.store).toBe(store);
		expect(getInstanceState(rawContainer)?.store).not.toBe(portalStore);
		fixture.destroy();
	});

	it('attaches and auto-renders content in a raw HUD scene after the parent scene', async () => {
		const hudCamera = new PerspectiveCamera(50);

		@Component({ selector: 'hud-camera-probe', template: '' })
		class HudCameraProbe {
			private store = injectStore();

			constructor() {
				effect((onCleanup) => {
					const previousCamera = this.store.snapshot.camera;
					this.store.update({ camera: hudCamera });
					onCleanup(() => this.store.update({ camera: previousCamera }));
				});
			}
		}

		@Component({
			template: `
				<ngt-portal [container]="hudScene" autoRender>
					<ng-template portalContent>
						<hud-camera-probe />
						<ngt-group name="hud-child" />
					</ng-template>
				</ngt-portal>
			`,
			imports: [HudCameraProbe, NgtPortal, NgtPortalAutoRender],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			hudScene = new Scene();
		}

		const { advance, sceneGraphComponentRef, store } = NgtTestBed.create(SceneGraph);
		const hudScene = sceneGraphComponentRef.instance.hudScene;
		const portalStore = getInstanceState(hudScene)?.store;
		expect(hudScene.getObjectByName('hud-child')).toBeDefined();
		expect(portalStore).not.toBeNull();
		expect(portalStore?.snapshot.camera).toBe(hudCamera);
		expect(store.snapshot.internal.priority).toBe(1);

		const render = vi.spyOn(store.snapshot.gl, 'render').mockImplementation(() => undefined);
		await advance(1);

		expect(render).toHaveBeenNthCalledWith(1, store.snapshot.scene, store.snapshot.camera);
		expect(render).toHaveBeenNthCalledWith(2, hudScene, portalStore!.snapshot.camera);
	});
});
