import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgtTestBed } from 'angular-three/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NgtsHTML, type NgtsHTMLOcclusionStrategy, type NgtsHTMLOcclusionTest } from './html';
import type { NgtsHTMLContentOptions } from './html-content';

describe('NgtsHTMLContent', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		document.body.replaceChildren();
	});

	it('applies non-transform pointer events and reactively reparents/prepends fullscreen content', () => {
		const firstTarget = document.createElement('section');
		const secondTarget = document.createElement('section');
		secondTarget.append(document.createElement('span'));
		document.body.append(firstTarget, secondTarget);

		@Component({
			template: `
				<ngts-html>
					<div [htmlContent]="contentOptions()">content</div>
				</ngts-html>
			`,
			imports: [NgtsHTML],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			contentOptions = signal<Partial<NgtsHTMLContentOptions>>({
				parent: firstTarget,
				pointerEvents: 'none',
				fullscreen: true,
			});
		}

		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph, {
			mockCanvasOptions: { beforeReturn: (canvas) => firstTarget.append(canvas) },
		});
		const host = firstTarget.querySelector<HTMLElement>('[data-ngts-html-content]')!;
		const container = host.firstElementChild as HTMLElement;

		expect(container.style.pointerEvents).toBe('none');
		expect(container.style.width).toBe('1280px');
		expect(container.style.height).toBe('800px');

		sceneGraphComponentRef.instance.contentOptions.set({
			parent: secondTarget,
			pointerEvents: 'auto',
			prepend: true,
		});
		fixture.detectChanges();
		TestBed.flushEffects();

		expect(host.parentElement).toBe(secondTarget);
		expect(secondTarget.firstElementChild).toBe(host);
		expect((host.firstElementChild as HTMLElement).style.pointerEvents).toBe('auto');
		expect((host.firstElementChild as HTMLElement).style.width).toBe('');

		fixture.destroy();
		expect(host.isConnected).toBe(false);
	});

	it('coordinates blending canvas styles across independent overlays and restores prior styles', () => {
		const target = document.createElement('section');
		document.body.append(target);

		@Component({
			template: `
				<ngts-html [options]="{ occlude: firstOcclude() }">
					<div [htmlContent]="{ zIndexRange: [400, 0] }">first</div>
				</ngts-html>
				<ngts-html [options]="{ occlude: secondOcclude() }">
					<div [htmlContent]="{ zIndexRange: [200, 0] }">second</div>
				</ngts-html>
			`,
			imports: [NgtsHTML],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			firstOcclude = signal<'blending' | false>('blending');
			secondOcclude = signal<'blending' | false>('blending');
		}

		const { canvas, fixture, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph, {
			mockCanvasOptions: {
				beforeReturn: (canvas) => {
					canvas.style.zIndex = '7';
					canvas.style.position = 'relative';
					canvas.style.pointerEvents = 'auto';
					target.append(canvas);
				},
			},
		});

		expect(canvas.style.zIndex).toBe('200');
		expect(canvas.style.position).toBe('absolute');
		expect(canvas.style.pointerEvents).toBe('none');

		sceneGraphComponentRef.instance.firstOcclude.set(false);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(canvas.style.zIndex).toBe('100');
		expect(canvas.style.pointerEvents).toBe('none');

		sceneGraphComponentRef.instance.secondOcclude.set(false);
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(canvas.style.zIndex).toBe('7');
		expect(canvas.style.position).toBe('relative');
		expect(canvas.style.pointerEvents).toBe('auto');

		sceneGraphComponentRef.instance.secondOcclude.set('blending');
		fixture.detectChanges();
		TestBed.flushEffects();
		expect(canvas.style.zIndex).toBe('100');

		fixture.destroy();
		expect(canvas.style.zIndex).toBe('7');
		expect(canvas.style.position).toBe('relative');
		expect(canvas.style.pointerEvents).toBe('auto');
	});

	it('updates z-index options and raycast occlusion while the label remains stationary', async () => {
		const target = document.createElement('section');
		document.body.append(target);

		@Component({
			template: `
				<ngt-mesh [position]="occluderPosition()">
					<ngt-box-geometry />
					<ngt-mesh-basic-material />
				</ngt-mesh>
				<ngts-html [options]="{ occlude: true }">
					<div [htmlContent]="contentOptions()">label</div>
				</ngts-html>
			`,
			imports: [NgtsHTML],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			occluderPosition = signal<[number, number, number]>([10, 0, 2]);
			contentOptions = signal<Partial<NgtsHTMLContentOptions>>({
				zIndexRange: [1000, 0],
				distanceFactor: 10,
			});
		}

		const { advance, fixture, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph, {
			mockCanvasOptions: { beforeReturn: (canvas) => target.append(canvas) },
		});
		const host = target.querySelector<HTMLElement>('[data-ngts-html-content]')!;

		await advance(1, 0.016);
		const initialZIndex = Number(host.style.zIndex);
		const initialTransform = host.style.transform;
		expect(host.style.display).not.toBe('none');

		sceneGraphComponentRef.instance.contentOptions.set({ zIndexRange: [10, 0], distanceFactor: 20 });
		fixture.detectChanges();
		await advance(1, 0.016);
		expect(Number(host.style.zIndex)).toBeLessThanOrEqual(10);
		expect(Number(host.style.zIndex)).not.toBe(initialZIndex);
		expect(host.style.transform).not.toBe(initialTransform);

		sceneGraphComponentRef.instance.occluderPosition.set([0, 0, 2]);
		fixture.detectChanges();
		await advance(1, 0.016);
		expect(host.style.display).toBe('none');

		sceneGraphComponentRef.instance.occluderPosition.set([10, 0, 2]);
		fixture.detectChanges();
		await advance(1, 0.016);
		expect(host.style.display).toBe('block');

		fixture.destroy();
	});

	it('uses a custom occlusion test without creating an occlusion mesh or raycasting', async () => {
		const target = document.createElement('section');
		document.body.append(target);

		@Component({
			template: `
				<ngts-html [options]="{ occlude: occlusionTest }">
					<div htmlContent>label</div>
				</ngts-html>
			`,
			imports: [NgtsHTML],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			hidden = false;
			occlusionTest = vi.fn<NgtsHTMLOcclusionTest>(() => this.hidden);
		}

		const { advance, fixture, scene, sceneGraphComponentRef, store } = NgtTestBed.create(SceneGraph, {
			mockCanvasOptions: { beforeReturn: (canvas) => target.append(canvas) },
		});
		const intersectObjects = vi.spyOn(store.snapshot.raycaster, 'intersectObjects');
		const host = target.querySelector<HTMLElement>('[data-ngts-html-content]')!;
		const anchor = scene.children[0];

		expect(anchor.children).toHaveLength(0);
		await advance(1, 0.016);
		const [occlusionTarget, frame] = sceneGraphComponentRef.instance.occlusionTest.mock.calls[0];
		expect(occlusionTarget.anchor).toBe(anchor);
		expect(occlusionTarget.element).toBe(host);
		expect(frame).toEqual({
			id: 1,
			state: expect.objectContaining({ camera: store.snapshot.camera, scene }),
		});
		expect(intersectObjects).not.toHaveBeenCalled();
		expect(host.style.display).not.toBe('none');

		sceneGraphComponentRef.instance.hidden = true;
		await advance(1, 0.016);
		expect(host.style.display).toBe('none');

		sceneGraphComponentRef.instance.hidden = false;
		await advance(1, 0.016);
		expect(host.style.display).toBe('block');
		expect(sceneGraphComponentRef.instance.occlusionTest).toHaveBeenCalledTimes(3);
		expect(intersectObjects).not.toHaveBeenCalled();

		fixture.destroy();
	});

	it('begins a shared custom strategy frame once for every eligible HTML target', async () => {
		const target = document.createElement('section');
		document.body.append(target);
		const releases: ReturnType<typeof vi.fn>[] = [];
		const strategy: NgtsHTMLOcclusionStrategy = {
			setupTarget: vi.fn(() => {
				const release = vi.fn();
				releases.push(release);
				return release;
			}),
			beginFrame: vi.fn(),
			isOccluded: vi.fn(({ element }) => element.textContent === 'hidden'),
		};

		@Component({
			template: `
				<ngts-html [options]="{ occlude: strategy }">
					<div htmlContent>visible</div>
				</ngts-html>
				<ngts-html [options]="{ occlude: strategy }">
					<div htmlContent>hidden</div>
				</ngts-html>
			`,
			imports: [NgtsHTML],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			strategy = strategy;
		}

		const { advance, fixture, scene, store } = NgtTestBed.create(SceneGraph, {
			mockCanvasOptions: { beforeReturn: (canvas) => target.append(canvas) },
		});
		const intersectObjects = vi.spyOn(store.snapshot.raycaster, 'intersectObjects');
		const hosts = [...target.querySelectorAll<HTMLElement>('[data-ngts-html-content]')];
		await advance(1, 0.016);

		expect(strategy.setupTarget).toHaveBeenCalledTimes(2);
		expect(strategy.beginFrame).toHaveBeenCalledOnce();
		const [frameTargets, frame] = vi.mocked(strategy.beginFrame!).mock.calls[0];
		expect(frameTargets.map(({ anchor }) => anchor)).toEqual(scene.children);
		expect(frameTargets.map(({ element }) => element)).toEqual(hosts);
		expect(frame).toEqual({ id: 1, state: expect.objectContaining({ scene }) });
		expect(strategy.isOccluded).toHaveBeenCalledTimes(2);
		expect(hosts[0].style.display).not.toBe('none');
		expect(hosts[1].style.display).toBe('none');
		expect(intersectObjects).not.toHaveBeenCalled();

		fixture.destroy();
		expect(releases).toHaveLength(2);
		expect(releases.every((release) => release.mock.calls.length === 1)).toBe(true);
	});

	it('remeasures the blending occlusion mesh after observed content resizes', async () => {
		let resizeCallback: ResizeObserverCallback | undefined;
		const disconnect = vi.fn();
		class MockResizeObserver {
			constructor(callback: ResizeObserverCallback) {
				resizeCallback = callback;
			}
			observe() {}
			disconnect() {
				disconnect();
			}
		}
		vi.stubGlobal('ResizeObserver', MockResizeObserver);

		const target = document.createElement('section');
		document.body.append(target);

		@Component({
			template: `
				<ngts-html [options]="{ occlude: 'blending' }">
					<div htmlContent>label</div>
				</ngts-html>
			`,
			imports: [NgtsHTML],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { advance, fixture, scene, store } = NgtTestBed.create(SceneGraph, {
			mockCanvasOptions: { beforeReturn: (canvas) => target.append(canvas) },
		});
		const invalidate = vi.spyOn(store.snapshot, 'invalidate');
		const host = target.querySelector<HTMLElement>('[data-ngts-html-content]')!;
		const container = host.firstElementChild as HTMLElement;
		Object.defineProperties(container, {
			clientWidth: { configurable: true, value: 100 },
			clientHeight: { configurable: true, value: 50 },
		});

		await advance(1, 0.016);
		const occlusionMesh = scene.children[0].children[0];
		const initialWidth = occlusionMesh.scale.x;

		Object.defineProperty(container, 'clientWidth', { configurable: true, value: 200 });
		resizeCallback?.([], {} as ResizeObserver);
		expect(invalidate).toHaveBeenCalled();
		await advance(1, 0.016);

		expect(occlusionMesh.scale.x).toBeCloseTo(initialWidth * 2);
		fixture.destroy();
		expect(disconnect).toHaveBeenCalledOnce();
	});

	it('sizes the fallback transform plane from content and preserves custom geometry sizing', async () => {
		const target = document.createElement('section');
		document.body.append(target);

		@Component({
			template: `
				<ngts-html [options]="{ name: 'default', occlude: 'blending', transform: true }">
					<div htmlContent>default</div>
				</ngts-html>
				<ngts-html [options]="{ name: 'custom', occlude: 'blending', transform: true, scale: [2, 4, 5] }">
					<ngt-box-geometry data-occlusion-geometry />
					<div htmlContent>custom</div>
				</ngts-html>
			`,
			imports: [NgtsHTML],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { advance, fixture, scene } = NgtTestBed.create(SceneGraph, {
			mockCanvasOptions: { beforeReturn: (canvas) => target.append(canvas) },
		});
		const containers = target.querySelectorAll<HTMLElement>('[data-ngts-html-content] > div > div > div');
		expect(containers).toHaveLength(2);
		Object.defineProperties(containers[0], {
			clientWidth: { configurable: true, value: 100 },
			clientHeight: { configurable: true, value: 50 },
		});
		Object.defineProperties(containers[1], {
			clientWidth: { configurable: true, value: 80 },
			clientHeight: { configurable: true, value: 40 },
		});

		await advance(1, 0.016);

		const defaultMesh = scene.getObjectByName('default')!.children[0];
		const customMesh = scene.getObjectByName('custom')!.children[0];
		expect(defaultMesh.scale.toArray()).toEqual([2.5, 1.25, 1]);
		expect(customMesh.scale.toArray()).toEqual([0.5, 0.25, 0.2]);

		fixture.destroy();
	});
});
