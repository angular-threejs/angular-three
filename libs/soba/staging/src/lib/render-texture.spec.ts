import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { extend } from 'angular-three';
import { NgtTestBed } from 'angular-three/testing';
import { BoxGeometry, Mesh, MeshStandardMaterial, WebGLRenderTarget } from 'three';
import { vi } from 'vitest';
// @ts-expect-error - troika-three-text does not publish complete type declarations
import { Text } from 'troika-three-text';
import { NgtsText } from '../../../abstractions/src/lib/text';
import { NgtsRenderTexture, NgtsRenderTextureContainer, NgtsRenderTextureImpl } from './render-texture';

describe(NgtsRenderTextureContainer.name, () => {
	afterEach(() => vi.restoreAllMocks());

	it('renders exactly the requested finite frame budget', async () => {
		@Component({
			template: `
				<ng-container renderTextureContainer [fbo]="fbo" [frames]="2" [renderPriority]="0" />
			`,
			imports: [NgtsRenderTextureContainer],
		})
		class SceneGraph {
			fbo = new WebGLRenderTarget();
		}

		const { advance, store } = NgtTestBed.create(SceneGraph);
		const gl = store.snapshot.gl;
		vi.spyOn(gl, 'getRenderTarget').mockReturnValue(null);
		vi.spyOn(gl, 'setRenderTarget').mockImplementation(() => undefined);
		const render = vi.spyOn(gl, 'render').mockImplementation(() => undefined);

		await Promise.resolve();
		await advance(2);
		expect(render).toHaveBeenCalledTimes(2);

		store.snapshot.internal.frames = 0;
		await advance(1);
		expect(render).toHaveBeenCalledTimes(2);

		// NgtTestBed runs frameloop="never", where invalidate() is intentionally
		// ignored. Mark the same root-global frame that invalidate() schedules at runtime.
		store.snapshot.internal.frames = 1;
		await advance(1);
		expect(render).toHaveBeenCalledTimes(2);

		store.snapshot.internal.frames = 0;
		await advance(1);
		expect(render).toHaveBeenCalledTimes(2);
	});

	it('rearms a finite budget when portal text synchronizes asynchronously', async () => {
		const syncStates: Array<{ text: string; color: unknown }> = [];
		let completeSync: (() => void) | undefined;
		vi.spyOn(Text.prototype, 'sync').mockImplementation(function (this: Text, callback?: () => void) {
			syncStates.push({ text: this.text, color: this.color });
			completeSync = callback;
		});

		@Component({
			selector: 'test-render-texture-material',
			template: `
				<ngt-mesh-standard-material>
					<ngts-render-texture [options]="{ frames: 1 }">
						<ng-template renderTextureContent>
							<ngts-text text="hello" [options]="{ color: '#555' }" />
						</ng-template>
					</ngts-render-texture>
				</ngt-mesh-standard-material>
			`,
			imports: [NgtsRenderTexture, NgtsText],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class RenderTextureMaterial {
			renderTexture = viewChild.required(NgtsRenderTextureImpl);
		}

		@Component({
			template: `
				<ngt-mesh #mesh>
					<ngt-box-geometry />
					<test-render-texture-material />
				</ngt-mesh>
			`,
			imports: [RenderTextureMaterial],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			mesh = viewChild.required<ElementRef<Mesh>>('mesh');
			material = viewChild.required(RenderTextureMaterial);

			constructor() {
				extend({ Mesh, BoxGeometry, MeshStandardMaterial });
			}
		}

		const { sceneGraphComponentRef, store } = NgtTestBed.create(SceneGraph);
		const renderTexture = sceneGraphComponentRef.instance.material().renderTexture();
		const virtualScene = Reflect.get(renderTexture, 'virtualScene');
		const fbo = Reflect.get(renderTexture, 'fbo');
		const material = sceneGraphComponentRef.instance.mesh().nativeElement.material as MeshStandardMaterial;
		const gl = store.snapshot.gl;
		vi.spyOn(gl, 'getRenderTarget').mockReturnValue(null);
		vi.spyOn(gl, 'setRenderTarget').mockImplementation(() => undefined);
		const render = vi.spyOn(gl, 'render').mockImplementation(() => undefined);
		expect(store.snapshot.internal.subscribers).toHaveLength(0);
		await Promise.resolve();

		expect(syncStates).toEqual([{ text: 'hello', color: '#555' }]);
		expect(virtualScene.children.some((child: unknown) => child instanceof Text)).toBe(true);
		expect(material.map).toBe(fbo.texture);
		expect(completeSync).toBeTypeOf('function');
		expect(store.snapshot.internal.subscribers).toHaveLength(1);
		expect(store.snapshot.internal.subscribers[0].store.snapshot.scene).toBe(virtualScene);

		store.snapshot.advance(0, false);
		store.snapshot.advance(16, false);
		expect(
			render.mock.calls.filter(([scene]) => scene === virtualScene),
			'initial virtual render',
		).toHaveLength(1);

		const requestFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		store.snapshot.internal.active = true;
		store.update({ frameloop: 'demand' });
		completeSync?.();
		expect(store.snapshot.internal.frames, 'async invalidation frame').toBe(1);

		store.snapshot.advance(32, false);
		expect(
			render.mock.calls.filter(([scene]) => scene === virtualScene),
			'refreshed virtual render',
		).toHaveLength(2);
		expect(requestFrame).toHaveBeenCalled();
	});
});
