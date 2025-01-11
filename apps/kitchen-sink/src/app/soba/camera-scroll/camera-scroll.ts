import { ChangeDetectionStrategy, Component, ElementRef, inject, InjectionToken } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';
import { Overlay } from './overlay';

export const SCROLL = new InjectionToken('scroll', {
	factory: () => ({ value: 0 }),
});

@Component({
	template: `
		<ngt-canvas shadows [eventSource]="host" [sceneGraph]="sceneGraph" />
		<app-overlay />
	`,
	imports: [NgtCanvas, Overlay],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'camera-scroll-soba' },
	styles: `
		@import url('https://rsms.me/inter/inter.css');

		:host {
			position: fixed;
			height: 100%;
			width: 100%;
			overflow: hidden;
			overscroll-behavior-y: none;
			background: radial-gradient(circle at bottom center, #212121 0%, #101010 80%);
			font-family: 'Inter var', sans-serif;
			-webkit-font-smoothing: antialiased;
		}
	`,
})
export default class CameraScroll {
	protected sceneGraph = Experience;
	protected host = inject<ElementRef<HTMLElement>>(ElementRef);
}
