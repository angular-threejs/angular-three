import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, ViewChild, computed, effect } from '@angular/core';
import {
	NgtArgs,
	createAttachFunction,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	type NgtNode,
} from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { BloomEffect, EffectComposer, EffectPass, Pass, RenderPass } from 'postprocessing';
import { Mesh, PlaneGeometry } from 'three';
import { GammaCorrectionShader, RGBShiftShader, ShaderPass } from 'three-stdlib';

// Using "extend" to extend the THREE catalogue of Angular Three custom renderer
extend({ EffectComposer, RenderPass, EffectPass });

declare global {
	interface HTMLElementTagNameMap {
		'ngt-shader-pass': NgtNode<ShaderPass, typeof ShaderPass>;
	}
}

/**
 * Vaporware Scene is ported from Maxime's article: https://blog.maximeheckel.com/posts/vaporwave-3d-scene-with-threejs/
 */
@Component({
	standalone: true,
	templateUrl: './scene.component.html',
	imports: [NgtArgs, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VaporwareScene {
	Math = Math;
	RGBShiftShader = RGBShiftShader;
	GammaCorrectionShader = GammaCorrectionShader;

	// injectNgtStore returns the Canvas Store that keeps all the data to the current Scene Graph under ngt-canvas
	private store = injectNgtStore();
	gl = this.store.select('gl');
	scene = this.store.select('scene');
	camera = this.store.select('camera');
	width = this.store.select('size', 'width');
	height = this.store.select('size', 'height');

	// injectNgtRef returns a NgtInjectedRef, which is similar to ElementRef but is enhanced with Signal to track some data changes.
	composerRef = injectNgtRef<EffectComposer>();
	geometryRef = injectNgtRef<PlaneGeometry>();

	// Angular Three supports using ViewChild to get the instaces of the THREE objects via ElementRef
	@ViewChild('frontPlane') frontPlane?: ElementRef<Mesh>;
	@ViewChild('backPlane') backPlane?: ElementRef<Mesh>;

	// most Angular Three's custom inject fns accept Functions as arguments so that consumers can pass in Signals
	// and the internal will react to changes.
	textures = injectNgtsTextureLoader(() => ({
		grid: 'assets/grid.png',
		displacement: 'assets/displacement.png',
		metalness: 'assets/metalness.png',
	}));

	effectPassArgs = computed(() => [
		this.camera(),
		new BloomEffect({ luminanceThreshold: 10, levels: 5, intensity: 10, radius: 10 }),
	]);

	// [attach] can accept an AttachFunction.
	passAttach = createAttachFunction<Pass, EffectComposer>(({ parent, child }) => {
		parent.addPass(child);
		// optionally returns a clean up function that will get called when the child is destroyed
		return () => parent.removePass(child);
	});

	constructor() {
		effect(() => {
			const [width, height, composer] = [this.width(), this.height(), this.composerRef.nativeElement];
			if (!composer) return;
			composer.setSize(width, height);
		});

		// injectBeforeRender allows consumers to hook into Animation Loop. This runs outside of Zone
		injectBeforeRender(({ clock }) => {
			const [frontPlane, backPlane] = [this.frontPlane?.nativeElement, this.backPlane?.nativeElement];
			if (frontPlane && backPlane) {
				const elapsedTime = clock.getElapsedTime();
				frontPlane.position.z = (elapsedTime * 0.15) % 2;
				backPlane.position.z = ((elapsedTime * 0.15) % 2) - 2;
			}
		});

		// injectBeforeRender can also accept a priority option. When priority differs between different
		// beforeRender callbacks, Angular Three opts out off automatic rendering. In this case,
		// the EffectComposer is responsible for rendering our scene with composer.render()
		let isSetSize = false;
		injectBeforeRender(
			({ delta }) => {
				const composer = this.composerRef.nativeElement;
				if (!composer) return;
				if (!isSetSize) {
					composer.setSize(this.width(), this.height());
					isSetSize = true;
				}
				composer.render(delta);
			},
			{ priority: 1 },
		);
	}
}
