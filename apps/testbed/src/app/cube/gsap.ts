import {
	afterNextRender,
	AfterRenderPhase,
	DestroyRef,
	Directive,
	effect,
	ElementRef,
	inject,
	Injector,
	Input,
	signal,
	untracked,
	type WritableSignal,
} from '@angular/core';
import { applyProps } from 'angular-three';
import { gsap } from 'gsap';

export function injectGsap(config: Record<string, { value: () => any } & gsap.TweenVars>) {
	const destroyRef = inject(DestroyRef);

	const entries = Object.entries(config);

	const targets: Record<string, WritableSignal<any>> = entries.reduce(
		(acc, [key]) => {
			acc[key] = signal(null!);
			return acc;
		},
		{} as Record<string, WritableSignal<any>>,
	);
	const timelines: Record<string, gsap.core.Timeline> = {};

	const context = gsap.context(() => {
		entries.forEach(([key]) => {
			timelines[key] = gsap.timeline();
		});
	});

	destroyRef.onDestroy(() => context.revert());

	return entries.reduce((acc, [key, { value, ...rest }]) => {
		const targetValue = untracked(value);
		acc[key] = (target: any, injector: Injector) => {
			queueMicrotask(() => {
				effect(
					(onCleanup) => {
						const _target = targets[key]();
						if (!_target) return;
						timelines[key].to(targetValue, Object.assign(rest, value()));
						onCleanup(() => timelines[key].clear());
					},
					{ injector },
				);
			});

			untracked(() => {
				applyProps(target, targetValue);
				targets[key].set(target);
				const originalOnUpdate = rest.onUpdate;
				rest.onUpdate = () => {
					originalOnUpdate?.();
					if (timelines[key].isActive()) {
						applyProps(target, targetValue);
					}
				};
			});
		};

		return acc;
	}, {} as any);
}

@Directive({ selector: '[withTimeline]', standalone: true })
export class WithTimeline {
	@Input({ required: true }) withTimeline!: any;

	constructor(elementRef: ElementRef<any>, injector: Injector) {
		afterNextRender(
			() => {
				this.withTimeline(elementRef.nativeElement, injector);
			},
			{ phase: AfterRenderPhase.Read },
		);
	}
}
