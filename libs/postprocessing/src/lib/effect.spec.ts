import { getInstanceState } from 'angular-three';
import { NgtTestBed } from 'angular-three/testing';
import { BlendFunction, BrightnessContrastEffect, EffectPass } from 'postprocessing';
import { vi } from 'vitest';
import { NgtpEffect } from './effect';
import { NgtpBrightnessContrast } from './effects/brightness-contrast';
import { NgtpNoise } from './effects/noise';

describe('effect blend mode', () => {
	afterEach(() => vi.restoreAllMocks());

	it('preserves constructor defaults when blend inputs are undefined', () => {
		const defaults = new BrightnessContrastEffect().blendMode;
		const { sceneGraphComponentRef } = NgtTestBed.create(NgtpBrightnessContrast);
		const effect = sceneGraphComponentRef.instance.effectRef()?.nativeElement;

		expect(effect).toBeDefined();
		expect(effect!.blendMode.blendFunction).toBe(defaults.blendFunction);
		expect(effect!.blendMode.opacity.value).toBe(defaults.opacity.value);
	});

	it('updates a live noise blend mode and recompiles its effect pass', () => {
		const { fixture, sceneGraphComponentRef, store } = NgtTestBed.create(NgtpNoise, {
			sceneGraphInputs: {
				blendFunction: BlendFunction.OVERLAY,
				opacity: 0.17,
				options: { premultiply: false },
			},
		});
		const hostEffect = sceneGraphComponentRef.injector.get(NgtpEffect);
		const effect = sceneGraphComponentRef.instance.effectRef()!.nativeElement;
		const pass = new EffectPass(store.snapshot.camera, effect);
		pass.recompile();
		const recompile = vi.spyOn(pass, 'recompile');

		expect(hostEffect.blendFunction()).toBe(BlendFunction.OVERLAY);
		expect(hostEffect.opacity()).toBe(0.17);
		expect(
			getInstanceState(effect)!
				.nonObjects()
				.map((node) => node.__ngt_renderer__?.[2]),
		).toEqual([BlendFunction.OVERLAY, 0.17]);
		expect(effect.blendMode.blendFunction).toBe(BlendFunction.OVERLAY);
		expect(effect.blendMode.opacity.value).toBe(0.17);

		sceneGraphComponentRef.setInput('blendFunction', BlendFunction.MULTIPLY);
		sceneGraphComponentRef.setInput('opacity', 0.4);
		fixture.detectChanges();

		expect(sceneGraphComponentRef.instance.effectRef()!.nativeElement).toBe(effect);
		expect(effect.blendMode.blendFunction).toBe(BlendFunction.MULTIPLY);
		expect(effect.blendMode.opacity.value).toBe(0.4);
		expect(recompile).toHaveBeenCalled();

		sceneGraphComponentRef.setInput('options', { premultiply: true });
		fixture.detectChanges();

		const replacement = sceneGraphComponentRef.instance.effectRef()!.nativeElement;
		expect(replacement).not.toBe(effect);
		expect(replacement.premultiply).toBe(true);
		expect(replacement.blendMode.blendFunction).toBe(BlendFunction.MULTIPLY);
		expect(replacement.blendMode.opacity.value).toBe(0.4);
		expect(getInstanceState(store.snapshot.scene)!.nonObjects()).toContain(replacement);
		expect(getInstanceState(store.snapshot.scene)!.nonObjects()).not.toContain(effect);
	});
});
