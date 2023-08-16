import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, ViewChild, effect } from '@angular/core';
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
import { Mesh, PlaneGeometry } from 'three';
import {
	EffectComposer,
	GammaCorrectionShader,
	RGBShiftShader,
	RenderPass,
	ShaderPass,
	UnrealBloomPass,
	type Pass,
} from 'three-stdlib';

// Using "extend" to extend the THREE catalogue of Angular Three custom renderer
extend({ EffectComposer, RenderPass, ShaderPass, UnrealBloomPass });

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
	template: `
		<!-- Top-level elements with "attach" will get attached to the root THREE.Scene  -->
		<!-- Here, the Fog will get attached to scene.fog -->
		<ngt-fog attach="fog" *args="['#000', 1, 2.5]" />

		<ngt-ambient-light [intensity]="Math.PI" />

		<ngt-spot-light
			color="#d53c3d"
			[position]="[0.5, 0.75, 2.2]"
			[intensity]="20"
			[distance]="25"
			[angle]="Math.PI * 0.1"
			[penumbra]="0.25"
			[decay]="10"
		>
			<ngt-vector3 *args="[-0.25, 0.25, 0.25]" attach="target.position" />
		</ngt-spot-light>

		<ngt-spot-light
			color="#d53c3d"
			[position]="[-0.5, 0.75, 2.2]"
			[intensity]="20"
			[distance]="25"
			[angle]="Math.PI * 0.1"
			[penumbra]="0.25"
			[decay]="10"
		>
			<ngt-vector3 *args="[0.25, 0.25, 0.25]" attach="target.position" />
		</ngt-spot-light>

		<!-- Good ol' ngIf-as trick to delay rendering of the whole block. -->
		<!-- We don't want to render anything until the textures are loaded  -->
		<ng-container *ngIf="textures() as textures">
			<!-- We use geometryRef for geometry because *args structural directive wraps ngt-plane-geometry -->
			<!-- A simple Template Variable "#geometry" won't work. -->
			<ngt-plane-geometry *args="[1, 2, 24, 24]" [ref]="geometryRef" />

			<!-- For material (or any element that doesn't have a structural directive attached to them) -->
			<!-- we can use Template Variable to get a hold of that element instance -->
			<ngt-mesh-standard-material
				#material
				[map]="textures.grid"
				[displacementMap]="textures.displacement"
				[metalnessMap]="textures.metalness"
				[displacementScale]="0.4"
				[metalness]="0.96"
				[roughness]="0.5"
			/>

			<!-- With access to geometry and material, we can reuse them -->
			<ngt-mesh
				#frontPlane
				[rotation]="[-Math.PI / 2, 0, 0]"
				[position]="[0, 0, 0.15]"
				[geometry]="geometryRef.nativeElement"
				[material]="material"
			/>

			<ngt-mesh
				#backPlane
				[rotation]="[-Math.PI / 2, 0, 0]"
				[position]="[0, 0, -1.85]"
				[geometry]="geometryRef.nativeElement"
				[material]="material"
			/>
		</ng-container>

		<ngt-effect-composer *args="[gl()]" [ref]="composerRef">
			<ngt-render-pass *args="[scene(), camera()]" [attach]="passAttach" />
			<ngt-shader-pass
				*args="[RGBShiftShader]"
				[attach]="passAttach"
				(afterAttach)="$event.node.uniforms['amount'].value = 0.0015"
			/>
			<ngt-shader-pass *args="[GammaCorrectionShader]" [attach]="passAttach" />
			<ngt-unreal-bloom-pass *args="[size().width / size().height, 0.2, 0.8, 0]" [attach]="passAttach" />
		</ngt-effect-composer>

		<ngts-orbit-controls
			[maxPolarAngle]="Math.PI / 2.1"
			[minPolarAngle]="Math.PI / 3"
			[minAzimuthAngle]="-Math.PI / 2"
			[maxAzimuthAngle]="Math.PI / 2"
		/>
	`,
	imports: [NgtArgs, NgtsOrbitControls, NgIf],
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
	size = this.store.select('size');

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

	// [attach] can accept an AttachFunction.
	passAttach = createAttachFunction<EffectComposer, Pass>(({ parent, child }) => {
		parent.addPass(child);
		// optionally returns a clean up function that will get called when the child is destroyed
		return () => parent.removePass(child);
	});

	constructor() {
		effect(() => {
			const [size, composer] = [this.size(), this.composerRef.nativeElement];
			if (!composer) return;
			composer.setSize(size.width, size.height);
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
		injectBeforeRender(
			({ delta }) => {
				const composer = this.composerRef.nativeElement;
				if (!composer) return;
				composer.render(delta);
			},
			{ priority: 1 },
		);
	}
}
