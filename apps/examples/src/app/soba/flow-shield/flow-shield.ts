import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BlendFunction, KernelSize } from 'postprocessing';
import { ENVIRONMENT_PRESETS, type NgtsEnvironmentPresets } from 'angular-three-soba/staging';
import {
	TweakpaneCheckbox,
	TweakpaneColor,
	TweakpaneFolder,
	TweakpaneList,
	TweakpaneNumber,
	TweakpanePane,
	TweakpanePoint,
} from 'angular-three-tweakpane';
import { NgtCanvas } from 'angular-three/dom';
import * as THREE from 'three';
import { SceneGraph } from './scene';
import { FlowShieldState } from './state';

@Component({
	template: `
		<ngt-canvas
			[camera]="{
				fov: state.canvas.fov(),
				near: state.canvas.near(),
				far: state.canvas.far(),
				position: state.canvas.position(),
			}"
			[gl]="{ antialias: state.canvas.antialias(), alpha: state.canvas.alpha() }"
			[dpr]="state.canvas.dpr()"
			[shadows]="state.canvas.shadows()"
			style="background: #0e0d0c"
		>
			<app-flow-shield-scene-graph *canvasContent />
		</ngt-canvas>

		<tweakpane-pane title="Force shield" [expanded]="true">
			<tweakpane-folder title="Canvas / camera">
				<tweakpane-number label="fov" [(value)]="state.canvas.fov" [params]="fovParams" />
				<tweakpane-number label="near" [(value)]="state.canvas.near" [params]="cameraClipParams" />
				<tweakpane-number label="far" [(value)]="state.canvas.far" [params]="distanceParams" />
				<tweakpane-point label="position" [(value)]="state.canvas.position" />
				<tweakpane-point label="dpr" [(value)]="state.canvas.dpr" [params]="dprParams" />
				<tweakpane-checkbox label="shadows" [(value)]="state.canvas.shadows" />
			</tweakpane-folder>

			<tweakpane-folder title="Environment">
				<tweakpane-list label="preset" [(value)]="state.environment.preset" [options]="presets" />
				<tweakpane-checkbox label="background" [(value)]="state.environment.background" />
				<tweakpane-number
					label="background blur"
					[(value)]="state.environment.backgroundBlurriness"
					[params]="unitParams"
				/>
				<tweakpane-number
					label="background intensity"
					[(value)]="state.environment.backgroundIntensity"
					[params]="intensityParams"
				/>
				<tweakpane-number
					label="environment intensity"
					[(value)]="state.environment.environmentIntensity"
					[params]="intensityParams"
				/>
			</tweakpane-folder>

			<tweakpane-folder title="Grid">
				<tweakpane-checkbox label="show" [(value)]="state.grid.show" />
				<tweakpane-number label="floor y" [(value)]="state.grid.floorPositionY" [params]="signedDistanceParams" />
				<tweakpane-point label="floor size" [(value)]="state.grid.floorSize" [params]="planeSizeParams" />
				<tweakpane-point label="plane size" [(value)]="state.grid.planeSize" [params]="planeSizeParams" />
				<tweakpane-point label="position" [(value)]="state.grid.position" />
				<tweakpane-number label="cell size" [(value)]="state.grid.cellSize" [params]="gridSizeParams" />
				<tweakpane-number label="cell thickness" [(value)]="state.grid.cellThickness" [params]="thicknessParams" />
				<tweakpane-color label="cell color" [(value)]="state.grid.cellColor" />
				<tweakpane-number label="section size" [(value)]="state.grid.sectionSize" [params]="gridSizeParams" />
				<tweakpane-number label="section thickness" [(value)]="state.grid.sectionThickness" [params]="thicknessParams" />
				<tweakpane-color label="section color" [(value)]="state.grid.sectionColor" />
				<tweakpane-number label="fade distance" [(value)]="state.grid.fadeDistance" [params]="distanceParams" />
				<tweakpane-number label="fade strength" [(value)]="state.grid.fadeStrength" [params]="intensityParams" />
				<tweakpane-checkbox label="infinite" [(value)]="state.grid.infiniteGrid" />
				<tweakpane-checkbox label="follow camera" [(value)]="state.grid.followCamera" />
			</tweakpane-folder>

			<tweakpane-folder title="Reflector">
				<tweakpane-number label="mirror" [(value)]="state.reflector.mirror" [params]="unitParams" />
				<tweakpane-number label="blur x" [(value)]="state.reflector.blurX" [params]="blurParams" />
				<tweakpane-number label="blur y" [(value)]="state.reflector.blurY" [params]="blurParams" />
				<tweakpane-number label="resolution" [(value)]="state.reflector.resolution" [params]="resolutionParams" />
				<tweakpane-number label="mix blur" [(value)]="state.reflector.mixBlur" [params]="intensityParams" />
				<tweakpane-number label="mix strength" [(value)]="state.reflector.mixStrength" [params]="intensityParams" />
				<tweakpane-number label="roughness" [(value)]="state.reflector.roughness" [params]="unitParams" />
				<tweakpane-number label="metalness" [(value)]="state.reflector.metalness" [params]="unitParams" />
				<tweakpane-color label="color" [(value)]="state.reflector.color" />
				<tweakpane-number label="depth scale" [(value)]="state.reflector.depthScale" [params]="intensityParams" />
				<tweakpane-checkbox label="transparent" [(value)]="state.reflector.transparent" />
			</tweakpane-folder>

			<tweakpane-folder title="Lighting">
				<tweakpane-number label="ambient intensity" [(value)]="state.lighting.ambientIntensity" [params]="intensityParams" />
				<tweakpane-color label="ambient color" [(value)]="state.lighting.ambientColor" />
				<tweakpane-number
					label="directional intensity"
					[(value)]="state.lighting.directionalIntensity"
					[params]="intensityParams"
				/>
				<tweakpane-color label="directional color" [(value)]="state.lighting.directionalColor" />
				<tweakpane-point label="directional position" [(value)]="state.lighting.directionalPosition" />
				<tweakpane-number label="shadow map width" [(value)]="state.lighting.shadowMapWidth" [params]="resolutionParams" />
				<tweakpane-number label="shadow map height" [(value)]="state.lighting.shadowMapHeight" [params]="resolutionParams" />
				<tweakpane-number label="shadow bias" [(value)]="state.lighting.shadowNormalBias" [params]="smallParams" />
				<tweakpane-number label="shadow near" [(value)]="state.lighting.shadowCameraNear" [params]="distanceParams" />
				<tweakpane-number label="shadow far" [(value)]="state.lighting.shadowCameraFar" [params]="distanceParams" />
				<tweakpane-number label="shadow left" [(value)]="state.lighting.shadowCameraLeft" [params]="signedDistanceParams" />
				<tweakpane-number label="shadow right" [(value)]="state.lighting.shadowCameraRight" [params]="signedDistanceParams" />
				<tweakpane-number label="shadow top" [(value)]="state.lighting.shadowCameraTop" [params]="signedDistanceParams" />
				<tweakpane-number label="shadow bottom" [(value)]="state.lighting.shadowCameraBottom" [params]="signedDistanceParams" />
			</tweakpane-folder>

			<tweakpane-folder title="Shield transform">
				<tweakpane-point label="position" [(value)]="state.shield.position" />
				<tweakpane-number label="rotation x" [(value)]="state.shield.rotationX" [params]="angleParams" />
				<tweakpane-number label="render order" [(value)]="state.shield.renderOrder" [params]="renderOrderParams" />
			</tweakpane-folder>

			<tweakpane-folder title="Shield gameplay">
				<tweakpane-number label="hit damage" [(value)]="state.shield.hitDamage" [params]="damageParams" />
				<tweakpane-number label="regen delay" [(value)]="state.shield.regenDelay" [params]="durationParams" />
				<tweakpane-number label="regen rate" [(value)]="state.shield.regenRate" [params]="unitParams" />
				<tweakpane-number label="regen pulse scale" [(value)]="state.shield.regenPulseScale" [params]="pulseParams" />
			</tweakpane-folder>

			<tweakpane-folder title="Shield material">
				<tweakpane-color label="color" [(value)]="state.shield.color" />
				<tweakpane-number label="hex scale" [(value)]="state.shield.hexScale" [params]="gridSizeParams" />
				<tweakpane-number label="edge width" [(value)]="state.shield.edgeWidth" [params]="smallParams" />
				<tweakpane-number label="fresnel power" [(value)]="state.shield.fresnelPower" [params]="intensityParams" />
				<tweakpane-number label="fresnel strength" [(value)]="state.shield.fresnelStrength" [params]="intensityParams" />
				<tweakpane-number label="opacity" [(value)]="state.shield.opacity" [params]="unitParams" />
				<tweakpane-number label="flash speed" [(value)]="state.shield.flashSpeed" [params]="speedParams" />
				<tweakpane-number label="flash intensity" [(value)]="state.shield.flashIntensity" [params]="intensityParams" />
				<tweakpane-number label="noise scale" [(value)]="state.shield.noiseScale" [params]="gridSizeParams" />
				<tweakpane-color label="noise edge color" [(value)]="state.shield.noiseEdgeColor" />
				<tweakpane-number label="noise edge width" [(value)]="state.shield.noiseEdgeWidth" [params]="smallParams" />
				<tweakpane-number
					label="noise edge intensity"
					[(value)]="state.shield.noiseEdgeIntensity"
					[params]="largeIntensityParams"
				/>
				<tweakpane-number
					label="noise edge smoothness"
					[(value)]="state.shield.noiseEdgeSmoothness"
					[params]="unitParams"
				/>
				<tweakpane-number label="hex opacity" [(value)]="state.shield.hexOpacity" [params]="unitParams" />
				<tweakpane-checkbox label="show hex" [(value)]="state.shield.showHex" />
				<tweakpane-number label="flow scale" [(value)]="state.shield.flowScale" [params]="gridSizeParams" />
				<tweakpane-number label="flow speed" [(value)]="state.shield.flowSpeed" [params]="speedParams" />
				<tweakpane-number label="flow intensity" [(value)]="state.shield.flowIntensity" [params]="largeIntensityParams" />
				<tweakpane-number label="fade start" [(value)]="state.shield.fadeStart" [params]="fadeStartParams" />
			</tweakpane-folder>

			<tweakpane-folder title="Shield hits">
				<tweakpane-number label="ring speed" [(value)]="state.shield.hitRingSpeed" [params]="speedParams" />
				<tweakpane-number label="ring width" [(value)]="state.shield.hitRingWidth" [params]="smallParams" />
				<tweakpane-number label="max radius" [(value)]="state.shield.hitMaxRadius" [params]="distanceParams" />
				<tweakpane-number label="duration" [(value)]="state.shield.hitDuration" [params]="durationParams" />
				<tweakpane-number label="intensity" [(value)]="state.shield.hitIntensity" [params]="largeIntensityParams" />
				<tweakpane-number label="impact radius" [(value)]="state.shield.hitImpactRadius" [params]="distanceParams" />
			</tweakpane-folder>

			<tweakpane-folder title="Postprocessing">
				<tweakpane-number label="multisampling" [(value)]="state.postprocessing.multisampling" [params]="sampleParams" />
				<tweakpane-list
					label="frame buffer"
					[(value)]="state.postprocessing.frameBufferType"
					[options]="frameBufferTypeOptions"
				/>
				<tweakpane-number label="bloom intensity" [(value)]="state.postprocessing.bloomIntensity" [params]="intensityParams" />
				<tweakpane-number
					label="bloom threshold"
					[(value)]="state.postprocessing.bloomLuminanceThreshold"
					[params]="unitParams"
				/>
				<tweakpane-number label="bloom radius" [(value)]="state.postprocessing.bloomRadius" [params]="unitParams" />
				<tweakpane-checkbox label="mipmap blur" [(value)]="state.postprocessing.bloomMipmapBlur" />
				<tweakpane-list label="kernel size" [(value)]="state.postprocessing.bloomKernelSize" [options]="kernelSizeOptions" />
				<tweakpane-checkbox label="noise premultiply" [(value)]="state.postprocessing.noisePremultiply" />
				<tweakpane-number label="noise opacity" [(value)]="state.postprocessing.noiseOpacity" [params]="unitParams" />
				<tweakpane-list
					label="noise blend"
					[(value)]="state.postprocessing.noiseBlendFunction"
					[options]="blendFunctionOptions"
				/>
			</tweakpane-folder>
		</tweakpane-pane>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtCanvas,
		SceneGraph,
		TweakpanePane,
		TweakpaneCheckbox,
		TweakpaneColor,
		TweakpaneList,
		TweakpaneNumber,
		TweakpanePoint,
		TweakpaneFolder,
	],
	host: { class: 'flow-shield-soba' },
	providers: [FlowShieldState],
})
export default class FlowShield {
	protected state = inject(FlowShieldState);
	protected presets = Object.keys(ENVIRONMENT_PRESETS) as NgtsEnvironmentPresets[];
	protected frameBufferTypeOptions = {
		UnsignedByte: THREE.UnsignedByteType,
		HalfFloat: THREE.HalfFloatType,
		Float: THREE.FloatType,
	};
	protected kernelSizeOptions = {
		VERY_SMALL: KernelSize.VERY_SMALL,
		SMALL: KernelSize.SMALL,
		MEDIUM: KernelSize.MEDIUM,
		LARGE: KernelSize.LARGE,
		VERY_LARGE: KernelSize.VERY_LARGE,
		HUGE: KernelSize.HUGE,
	};
	protected blendFunctionOptions = {
		SKIP: BlendFunction.SKIP,
		ADD: BlendFunction.ADD,
		ALPHA: BlendFunction.ALPHA,
		AVERAGE: BlendFunction.AVERAGE,
		COLOR_BURN: BlendFunction.COLOR_BURN,
		COLOR_DODGE: BlendFunction.COLOR_DODGE,
		DARKEN: BlendFunction.DARKEN,
		DIFFERENCE: BlendFunction.DIFFERENCE,
		EXCLUSION: BlendFunction.EXCLUSION,
		LIGHTEN: BlendFunction.LIGHTEN,
		MULTIPLY: BlendFunction.MULTIPLY,
		OVERLAY: BlendFunction.OVERLAY,
		SCREEN: BlendFunction.SCREEN,
	};
	protected unitParams = { min: 0, max: 1, step: 0.01 };
	protected dprParams = { x: { min: 0.1, max: 4, step: 0.1 }, y: { min: 0.1, max: 4, step: 0.1 } };
	protected smallParams = { min: 0, max: 0.5, step: 0.001 };
	protected fovParams = { min: 1, max: 120, step: 1 };
	protected cameraClipParams = { min: 0.01, max: 10, step: 0.01 };
	protected intensityParams = { min: 0, max: 5, step: 0.01 };
	protected largeIntensityParams = { min: 0, max: 20, step: 0.1 };
	protected gridSizeParams = { min: 0.1, max: 20, step: 0.1 };
	protected thicknessParams = { min: 0, max: 5, step: 0.01 };
	protected distanceParams = { min: 0, max: 100, step: 0.1 };
	protected signedDistanceParams = { min: -100, max: 100, step: 0.1 };
	protected speedParams = { min: -10, max: 10, step: 0.01 };
	protected durationParams = { min: 0, max: 20, step: 0.1 };
	protected damageParams = { min: 0, max: 100, step: 1 };
	protected pulseParams = { min: 0, max: 0.25, step: 0.001 };
	protected angleParams = { min: -Math.PI * 2, max: Math.PI * 2, step: 0.01 };
	protected renderOrderParams = { min: -10, max: 10, step: 1 };
	protected resolutionParams = { min: 16, max: 2048, step: 1 };
	protected planeSizeParams = { x: { min: 1, max: 500, step: 1 }, y: { min: 1, max: 500, step: 1 } };
	protected sampleParams = { min: 0, max: 8, step: 1 };
	protected blurParams = { min: 0, max: 2048, step: 1 };
	protected fadeStartParams = { min: -1, max: 1, step: 0.01 };
}
