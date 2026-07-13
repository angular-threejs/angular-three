import { Component, ComponentRef, ViewContainerRef, afterNextRender, viewChild } from '@angular/core';
import { NgtTestBed } from 'angular-three/testing';
import { vi } from 'vitest';
// @ts-expect-error - troika-three-text does not publish complete type declarations
import { Text } from 'troika-three-text';
import { NgtsText } from './text';

describe(NgtsText.name, () => {
	afterEach(() => vi.restoreAllMocks());

	it('should render properly', async () => {
		const { scene, fixture, toGraph } = NgtTestBed.create(NgtsText, {
			sceneGraphInputs: { text: 'hello' },
		});
		fixture.detectChanges();

		expect(scene.children.length).toEqual(1);
		expect(toGraph()).toMatchSnapshot();
	});

	it('synchronizes after primitive properties are applied', async () => {
		const syncStates: Array<{ text: string; color: unknown }> = [];
		vi.spyOn(Text.prototype, 'sync').mockImplementation(function (this: Text, callback?: () => void) {
			syncStates.push({ text: this.text, color: this.color });
			callback?.();
		});

		NgtTestBed.create(NgtsText, {
			sceneGraphInputs: { text: 'front', options: { color: 'black' } },
		});
		await Promise.resolve();

		expect(syncStates).toEqual([{ text: 'front', color: 'black' }]);
	});

	it('keeps in-flight text synchronizations active across input changes', async () => {
		const completeSync: Array<() => void> = [];
		vi.spyOn(Text.prototype, 'sync').mockImplementation((callback?: () => void) => {
			if (callback) completeSync.push(callback);
		});

		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(NgtsText, {
			sceneGraphInputs: { text: 'hello' },
		});
		const synced = vi.fn();
		sceneGraphComponentRef.instance.synced.subscribe(synced);
		await Promise.resolve();

		sceneGraphComponentRef.setInput('text', 'world');
		fixture.detectChanges();
		await Promise.resolve();
		expect(completeSync).toHaveLength(2);

		completeSync[0]();
		await Promise.resolve();

		expect(synced).toHaveBeenCalledWith(sceneGraphComponentRef.instance.troikaMesh);
	});

	it('synchronizes when created during an after-render callback', async () => {
		const syncStates: Array<{ text: string; color: unknown }> = [];
		vi.spyOn(Text.prototype, 'sync').mockImplementation(function (this: Text) {
			syncStates.push({ text: this.text, color: this.color });
		});

		@Component({
			template: `
				<ng-container #textHost />
			`,
		})
		class DeferredTextHost {
			private textHost = viewChild.required('textHost', { read: ViewContainerRef });
			textRef?: ComponentRef<NgtsText>;

			constructor() {
				afterNextRender(() => {
					const textRef = this.textHost().createComponent(NgtsText);
					textRef.setInput('text', 'deferred');
					textRef.setInput('options', { color: 'black' });
					textRef.changeDetectorRef.detectChanges();
					this.textRef = textRef;
				});
			}
		}

		NgtTestBed.create(DeferredTextHost);
		await Promise.resolve();

		expect(syncStates).toEqual([{ text: 'deferred', color: 'black' }]);
	});
});
