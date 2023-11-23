import {
	DestroyRef,
	Directive,
	ElementRef,
	Injector,
	Input,
	afterNextRender,
	effect,
	inject,
	signal,
	untracked,
	type WritableSignal,
} from '@angular/core';
import { gsap } from 'gsap';
import { applyProps } from 'libs/core/src/lib/utils/apply-props';

export function injectGsap(config: Record<string, { value: () => any } & gsap.TweenVars>) {
	const destroyRef = inject(DestroyRef);
	const targets: Record<string, WritableSignal<any>> = {};
	const timelines: Record<string, gsap.core.Timeline> = {};
	let context: gsap.Context;

	const entries = Object.entries(config);

	afterNextRender(() => {
		context = gsap.context(() => {
			entries.forEach(([key]) => {
				timelines[key] = gsap.timeline();
				targets[key] = signal<any | null>(null);
			});
		});
	});

	destroyRef.onDestroy(() => context?.revert());

	return entries.reduce((acc, [key, { value, ...rest }]) => {
		const preConfig = {
			[key]: untracked(value),
		};

		acc[key] = {
			start: (target: any, injector: Injector) => {
				untracked(() => {
					targets[key].set(target);
					rest.onUpdate = () => {
						if (timelines[key].isActive()) {
							applyProps(target, preConfig);
						}
					};
				});
				queueMicrotask(() => {
					effect(
						(onCleanup) => {
							if (!target) return;

							timelines[key].to(preConfig, { ...rest, [key]: value() });

							onCleanup(() => timelines[key].clear());
						},
						{ injector },
					);
				});
			},
		};

		return acc;
	}, {} as any);
}

@Directive({ selector: '[withTimeline]', standalone: true })
export class WithTimeline {
	@Input({ required: true }) withTimeline!: any;

	constructor(elementRef: ElementRef<any>, injector: Injector) {
		afterNextRender(() => {
			this.withTimeline.start(elementRef.nativeElement, injector);
		});
	}
}
