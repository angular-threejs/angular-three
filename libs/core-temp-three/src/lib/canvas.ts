import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EnvironmentInjector,
	Input,
	NgZone,
	OnInit,
	Type,
	ViewChild,
	ViewContainerRef,
	createEnvironmentInjector,
	inject,
} from '@angular/core';
import { NgxResize, provideNgxResizeOptions, type NgxResizeResult } from 'ngx-resize';
import { provideNgtRenderer } from './renderer';

@Component({
	selector: 'ngt-scene-graph-renderer',
	standalone: true,
	template: `<ng-container #sceneGraphAnchor />`,
})
export class NgtSceneGraphRenderer implements OnInit {
	private envInjector = inject(EnvironmentInjector);

	@Input() sceneGraph!: Type<unknown>;

	@ViewChild('sceneGraphAnchor', { static: true, read: ViewContainerRef }) anchor!: ViewContainerRef;

	ngOnInit() {
		// TODO: logic before rendering THREE.js elements
		this.anchor.createComponent(this.sceneGraph, { environmentInjector: this.envInjector });
	}
}

@Component({
	selector: 'ngt-canvas',
	standalone: true,
	template: `
		<div (ngxResize)="onResize($event)" style="width: 100%; height: 100%">
			<canvas #glCanvas style="display:block"> </canvas>
		</div>
	`,
	imports: [NgxResize],
	providers: [provideNgxResizeOptions({ emitInZone: false, emitInitialResult: true })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		style: 'position: relative; display: block; width: 100%; height: 100%; overflow: hidden',
	},
})
export class NgtCanvas implements OnInit {
	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private vcr = inject(ViewContainerRef);
	private envInjector = inject(EnvironmentInjector);
	private zone = inject(NgZone);

	@Input({ required: true }) sceneGraph!: Type<unknown>;

	@ViewChild('glCanvas', { static: true }) glCanvas!: ElementRef<HTMLCanvasElement>;

	// NOTE: runs outside of Zone due to emitInZone: false
	onResize({ width, height }: NgxResizeResult) {
		console.log('resize');
		this.initiateRender();
	}

	ngOnInit() {
		console.log('onInit');
	}

	private initiateRender() {
		const sceneGraphRendererRef = this.vcr.createComponent(NgtSceneGraphRenderer, {
			environmentInjector: createEnvironmentInjector([provideNgtRenderer()], this.envInjector),
		});
		sceneGraphRendererRef.setInput('sceneGraph', this.sceneGraph);
		sceneGraphRendererRef.changeDetectorRef.detectChanges();
	}
}
