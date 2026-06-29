import { Injectable, signal } from '@angular/core';
import { BlendFunction, KernelSize } from 'postprocessing';
import { type NgtsEnvironmentPresets } from 'angular-three-soba/staging';
import * as THREE from 'three';
import type { Vector2Tuple, Vector3Tuple } from 'three';

@Injectable()
export class FlowShieldState {
	canvas = {
		fov: signal(20),
		near: signal(0.1),
		far: signal(200),
		position: signal<Vector3Tuple>([8, 5, 8]),
		antialias: signal(true),
		alpha: signal(false),
		dpr: signal<Vector2Tuple>([1, 1.5]),
		shadows: signal(true),
	};

	grid = {
		show: signal(true),
		floorPositionY: signal(-0.1),
		floorSize: signal<Vector2Tuple>([200, 200]),
		planeSize: signal<Vector2Tuple>([100, 100]),
		position: signal<Vector3Tuple>([0, 0, 0]),
		cellSize: signal(3),
		cellThickness: signal(1),
		cellColor: signal('#adadad'),
		sectionSize: signal(1),
		sectionThickness: signal(0.5),
		sectionColor: signal('#5c5854'),
		fadeDistance: signal(67),
		fadeStrength: signal(3.2),
		infiniteGrid: signal(true),
		followCamera: signal(false),
	};

	reflector = {
		mirror: signal(1),
		blurX: signal(512),
		blurY: signal(512),
		resolution: signal(512),
		mixBlur: signal(2),
		mixStrength: signal(1),
		roughness: signal(0.5),
		metalness: signal(0.5),
		color: signal('#ffffff'),
		depthScale: signal(1.8),
		transparent: signal(true),
	};

	environment = {
		preset: signal<NgtsEnvironmentPresets>('night'),
		background: signal(true),
		backgroundBlurriness: signal(0.9),
		backgroundIntensity: signal(0.1),
		environmentIntensity: signal(0.3),
	};

	lighting = {
		ambientIntensity: signal(0.4),
		ambientColor: signal('#ffffff'),
		directionalIntensity: signal(1.5),
		directionalColor: signal('#ffeedd'),
		directionalPosition: signal<Vector3Tuple>([5, 8, 3]),
		shadowMapWidth: signal(2048),
		shadowMapHeight: signal(2048),
		shadowNormalBias: signal(0.04),
		shadowCameraNear: signal(0.5),
		shadowCameraFar: signal(50),
		shadowCameraLeft: signal(-10),
		shadowCameraRight: signal(10),
		shadowCameraTop: signal(10),
		shadowCameraBottom: signal(-10),
	};

	shield = {
		position: signal<Vector3Tuple>([0, 2, 0.2]),
		rotationX: signal(Math.PI / 2),
		renderOrder: signal(2),
		hitDamage: signal(10),
		regenDelay: signal(3),
		regenRate: signal(0.2),
		regenPulseScale: signal(0.05),
		color: signal('#F59E0B'),
		life: signal(1),
		hexScale: signal(3),
		edgeWidth: signal(0.06),
		fresnelPower: signal(1.8),
		fresnelStrength: signal(1.75),
		opacity: signal(0.76),
		flashSpeed: signal(0.6),
		flashIntensity: signal(0.11),
		noiseScale: signal(1.3),
		noiseEdgeColor: signal('#FCD34D'),
		noiseEdgeWidth: signal(0.02),
		noiseEdgeIntensity: signal(10),
		noiseEdgeSmoothness: signal(0.5),
		hexOpacity: signal(0.13),
		showHex: signal(true),
		flowScale: signal(2.4),
		flowSpeed: signal(1.13),
		flowIntensity: signal(4),
		hitRingSpeed: signal(1.75),
		hitRingWidth: signal(0.12),
		hitMaxRadius: signal(0.85),
		hitDuration: signal(1.8),
		hitIntensity: signal(4.1),
		hitImpactRadius: signal(0.3),
		fadeStart: signal(-0.75),
	};

	postprocessing = {
		multisampling: signal(0),
		frameBufferType: signal(THREE.HalfFloatType),
		bloomIntensity: signal(1.6),
		bloomLuminanceThreshold: signal(0.1),
		bloomRadius: signal(0.56),
		bloomMipmapBlur: signal(true),
		bloomKernelSize: signal(KernelSize.LARGE),
		noisePremultiply: signal(false),
		noiseOpacity: signal(0.17),
		noiseBlendFunction: signal(BlendFunction.OVERLAY),
	};
}
