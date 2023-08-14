import { Directive, Input, computed, effect } from '@angular/core';
import { NgtAnyRecord, getLocalState, injectNgtRef, injectNgtStore, is, signalStore } from 'angular-three';
import { BlendFunction, Effect } from 'postprocessing';

export type NgtpEffectState = {
	blendFunction?: BlendFunction;
	opacity?: number;
};

@Directive()
export abstract class NgtpEffect<TEffect extends Effect> {
	inputs = signalStore<NgtpEffectState>();

	@Input() effectRef = injectNgtRef<TEffect>();

	@Input({ alias: 'blendFunction' }) set _blendFunction(blendFunction: BlendFunction) {
		this.inputs.set({ blendFunction });
	}

	@Input({ alias: 'opacity' }) set _opacity(opacity: number) {
		this.inputs.set({ opacity });
	}

	protected defaultBlendFunction = BlendFunction.NORMAL;
	protected nativeArgs: () => NgtAnyRecord[] = () => [];

	blendFunction = this.inputs.select('blendFunction');
	opacity = this.inputs.select('opacity');

	protected store = injectNgtStore();
	protected camera = this.store.select('camera');
	private invalidate = this.store.select('invalidate');

	private previousInputs?: NgtAnyRecord;

	private nativeInputs = computed(
		() => {
			const effect = this.effectRef.nativeElement;
			if (!effect) return this.previousInputs || null;
			const localState = getLocalState(effect);
			if (!localState) return this.previousInputs || null;
			const nativeProps = localState.nativeProps.state();
			delete nativeProps['__ngt_dummy_state__'];
			if ('camera' in nativeProps) {
				delete nativeProps['camera'];
			}
			if (!Object.keys(nativeProps).length) return this.previousInputs || null;
			return (this.previousInputs = nativeProps);
		},
		{ equal: (a, b) => is.equ(a, b, { objects: 'shallow' }) },
	);

	args = computed(() => {
		const [nativeInputs, nativeArgs] = [this.nativeInputs(), this.nativeArgs()];
		if (nativeInputs) {
			nativeArgs.push(nativeInputs);
		}

		return nativeArgs;
	});

	constructor() {
		this.setBlendMode();
	}

	private setBlendMode() {
		effect(() => {
			const [blendFunction, opacity, effect, invalidate] = [
				this.blendFunction(),
				this.opacity(),
				this.effectRef.nativeElement,
				this.invalidate(),
			];

			if (!effect) return;
			effect.blendMode.blendFunction =
				!blendFunction && blendFunction !== 0 ? this.defaultBlendFunction : blendFunction;
			if (opacity !== undefined) effect.blendMode.opacity.value = opacity;
			invalidate();
		});
	}
}
