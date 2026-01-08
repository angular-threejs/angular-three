/*
 * Integration and compilation: @N8Programs
 * Inspired by:
 *  https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shadowmap_pcss.html
 *  https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-17-efficient-soft-edged-shadows-using
 *  https://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
 *  https://github.com/mrdoob/three.js/blob/master/examples/webgl_shadowmap_pcss.html [spidersharma03]
 *  https://spline.design/
 * Concept:
 *  https://www.gamedev.net/tutorials/programming/graphics/contact-hardening-soft-shadows-made-fast-r4906/
 * Vogel Disk Implementation:
 *  https://www.shadertoy.com/view/4l3yRM [ashalah]
 * High-Frequency Noise Implementation:
 *  https://www.shadertoy.com/view/tt3fDH [spawner64]
 */

import { Directive, effect, input } from '@angular/core';
import { injectStore } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { getVersion } from './constants';

/**
 * Options for configuring soft shadows using PCSS (Percentage-Closer Soft Shadows).
 */
export interface NgtsSoftShadowsOptions {
	/** Size of the light source (the larger the softer the light), default: 25 */
	size: number;
	/** Number of samples (more samples less noise but more expensive), default: 10 */
	samples: number;
	/** Depth focus, use it to shift the focal point (where the shadow is the sharpest), default: 0 (the beginning) */
	focus: number;
}

const defaultOptions: NgtsSoftShadowsOptions = {
	size: 25,
	samples: 10,
	focus: 0,
};

/**
 * Generates PCSS shader code for Three.js < r182 (uses RGBA-packed depth)
 */
function pcssLegacy(options: NgtsSoftShadowsOptions): string {
	const { focus, size, samples } = options;
	return `
#define PENUMBRA_FILTER_SIZE float(${size})
#define RGB_NOISE_FUNCTION(uv) (randRGB(uv))
vec3 randRGB(vec2 uv) {
  return vec3(
    fract(sin(dot(uv, vec2(12.75613, 38.12123))) * 13234.76575),
    fract(sin(dot(uv, vec2(19.45531, 58.46547))) * 43678.23431),
    fract(sin(dot(uv, vec2(23.67817, 78.23121))) * 93567.23423)
  );
}

vec3 lowPassRandRGB(vec2 uv) {
  vec3 result = vec3(0);
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0, +1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0, +1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0, +1.0));
  result *= 0.111111111;
  return result;
}

vec3 highPassRandRGB(vec2 uv) {
  return RGB_NOISE_FUNCTION(uv) - lowPassRandRGB(uv) + 0.5;
}

vec2 vogelDiskSample(int sampleIndex, int sampleCount, float angle) {
  const float goldenAngle = 2.399963f;
  float r = sqrt(float(sampleIndex) + 0.5f) / sqrt(float(sampleCount));
  float theta = float(sampleIndex) * goldenAngle + angle;
  float sine = sin(theta);
  float cosine = cos(theta);
  return vec2(cosine, sine) * r;
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) {
  return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker(sampler2D shadowMap, vec2 uv, float compare, float angle) {
  float texelSize = 1.0 / float(textureSize(shadowMap, 0).x);
  float blockerDepthSum = float(${focus});
  float blockers = 0.0;
  int j = 0;
  vec2 offset = vec2(0.);
  float depth = 0.;

  #pragma unroll_loop_start
  for(int i = 0; i < ${samples}; i ++) {
    offset = (vogelDiskSample(j, ${samples}, angle) * texelSize) * 2.0 * PENUMBRA_FILTER_SIZE;
    depth = unpackRGBAToDepth( texture2D( shadowMap, uv + offset ) );
    if (depth < compare) {
      blockerDepthSum += depth;
      blockers++;
    }
    j++;
  }
  #pragma unroll_loop_end

  if (blockers > 0.0) {
    return blockerDepthSum / blockers;
  }
  return -1.0;
}

float vogelFilter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius, float angle) {
  float texelSize = 1.0 / float(textureSize(shadowMap, 0).x);
  float shadow = 0.0f;
  int j = 0;
  vec2 vogelSample = vec2(0.0);
  vec2 offset = vec2(0.0);

  #pragma unroll_loop_start
  for (int i = 0; i < ${samples}; i++) {
    vogelSample = vogelDiskSample(j, ${samples}, angle) * texelSize;
    offset = vogelSample * (1.0 + filterRadius * float(${size}));
    shadow += step( zReceiver, unpackRGBAToDepth( texture2D( shadowMap, uv + offset ) ) );
    j++;
  }
  #pragma unroll_loop_end

  return shadow * 1.0 / ${samples}.0;
}

float PCSS (sampler2D shadowMap, vec4 coords) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z;
  float angle = highPassRandRGB(gl_FragCoord.xy).r * PI2;
  float avgBlockerDepth = findBlocker(shadowMap, uv, zReceiver, angle);
  if (avgBlockerDepth == -1.0) {
    return 1.0;
  }
  float penumbraRatio = penumbraSize(zReceiver, avgBlockerDepth);
  return vogelFilter(shadowMap, uv, zReceiver, 1.25 * penumbraRatio, angle);
}`;
}

/**
 * Generates PCSS shader code for Three.js >= r182 (uses native depth textures)
 */
function pcssModern(options: NgtsSoftShadowsOptions): string {
	const { focus, size, samples } = options;
	return `
#define PENUMBRA_FILTER_SIZE float(${size})
#define RGB_NOISE_FUNCTION(uv) (randRGB(uv))
vec3 randRGB(vec2 uv) {
  return vec3(
    fract(sin(dot(uv, vec2(12.75613, 38.12123))) * 13234.76575),
    fract(sin(dot(uv, vec2(19.45531, 58.46547))) * 43678.23431),
    fract(sin(dot(uv, vec2(23.67817, 78.23121))) * 93567.23423)
  );
}

vec3 lowPassRandRGB(vec2 uv) {
  vec3 result = vec3(0);
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0, +1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0, +1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0, +1.0));
  result *= 0.111111111;
  return result;
}

vec3 highPassRandRGB(vec2 uv) {
  return RGB_NOISE_FUNCTION(uv) - lowPassRandRGB(uv) + 0.5;
}

vec2 pcssVogelDiskSample(int sampleIndex, int sampleCount, float angle) {
  const float goldenAngle = 2.399963f;
  float r = sqrt(float(sampleIndex) + 0.5f) / sqrt(float(sampleCount));
  float theta = float(sampleIndex) * goldenAngle + angle;
  float sine = sin(theta);
  float cosine = cos(theta);
  return vec2(cosine, sine) * r;
}

float pcssPenumbraSize( const in float zReceiver, const in float zBlocker ) {
  return (zReceiver - zBlocker) / zBlocker;
}

float pcssFindBlocker(sampler2D shadowMap, vec2 uv, float compare, float angle) {
  float texelSize = 1.0 / float(textureSize(shadowMap, 0).x);
  float blockerDepthSum = float(${focus});
  float blockers = 0.0;
  int j = 0;
  vec2 offset = vec2(0.);
  float depth = 0.;

  #pragma unroll_loop_start
  for(int i = 0; i < ${samples}; i ++) {
    offset = (pcssVogelDiskSample(j, ${samples}, angle) * texelSize) * 2.0 * PENUMBRA_FILTER_SIZE;
    depth = texture2D( shadowMap, uv + offset ).r;
    if (depth < compare) {
      blockerDepthSum += depth;
      blockers++;
    }
    j++;
  }
  #pragma unroll_loop_end

  if (blockers > 0.0) {
    return blockerDepthSum / blockers;
  }
  return -1.0;
}

float pcssVogelFilter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius, float angle) {
  float texelSize = 1.0 / float(textureSize(shadowMap, 0).x);
  float shadow = 0.0f;
  int j = 0;
  vec2 vogelSample = vec2(0.0);
  vec2 offset = vec2(0.0);

  #pragma unroll_loop_start
  for (int i = 0; i < ${samples}; i++) {
    vogelSample = pcssVogelDiskSample(j, ${samples}, angle) * texelSize;
    offset = vogelSample * (1.0 + filterRadius * float(${size}));
    shadow += step( zReceiver, texture2D( shadowMap, uv + offset ).r );
    j++;
  }
  #pragma unroll_loop_end

  return shadow * 1.0 / ${samples}.0;
}

float PCSS (sampler2D shadowMap, vec4 coords, float shadowIntensity) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z;
  float angle = highPassRandRGB(gl_FragCoord.xy).r * PI2;
  float avgBlockerDepth = pcssFindBlocker(shadowMap, uv, zReceiver, angle);
  if (avgBlockerDepth == -1.0) {
    return 1.0;
  }
  float penumbraRatio = pcssPenumbraSize(zReceiver, avgBlockerDepth);
  float shadow = pcssVogelFilter(shadowMap, uv, zReceiver, 1.25 * penumbraRatio, angle);
  return mix( 1.0, shadow, shadowIntensity );
}`;
}

function reset(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void {
	scene.traverse((object) => {
		if ((object as THREE.Mesh).material) {
			gl.properties.remove((object as THREE.Mesh).material);
			((object as THREE.Mesh).material as THREE.Material).dispose?.();
		}
	});
	gl.info.programs!.length = 0;
	gl.compile(scene, camera);
}

/**
 * A directive that injects Percentage-Closer Soft Shadows (PCSS) into the scene.
 *
 * PCSS produces contact-hardening soft shadows where shadows are sharper near the
 * contact point and softer further away, creating more realistic shadow effects.
 *
 * @example
 * ```html
 * <ngts-soft-shadows [options]="{ size: 25, samples: 10, focus: 0 }" />
 * ```
 */
@Directive({ selector: 'ngts-soft-shadows' })
export class NgtsSoftShadows {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	constructor() {
		const store = injectStore();

		effect((onCleanup) => {
			const { gl, scene, camera } = store.snapshot;
			const options = this.options();
			const version = getVersion();

			const original = THREE.ShaderChunk.shadowmap_pars_fragment;

			if (version >= 182) {
				// Three.js r182+ uses native depth textures and has a different shader structure.
				// The PCF path uses sampler2DShadow, but PCSS needs sampler2D for manual depth comparison.
				// We inject our PCSS code and replace the BASIC shadow type's getShadow function,
				// then also replace the PCF uniform declarations to use sampler2D instead of sampler2DShadow.
				const pcssCode = pcssModern(options);

				let shader = THREE.ShaderChunk.shadowmap_pars_fragment;

				// 1. Inject PCSS functions after USE_SHADOWMAP
				shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP\n' + pcssCode);

				// 2. Replace sampler2DShadow with sampler2D for directional lights (PCF path)
				shader = shader.replace(
					/#if defined\( SHADOWMAP_TYPE_PCF \)\s+uniform sampler2DShadow directionalShadowMap\[ NUM_DIR_LIGHT_SHADOWS \];/,
					`#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];`,
				);

				// 3. Replace sampler2DShadow with sampler2D for spot lights (PCF path)
				shader = shader.replace(
					/#if defined\( SHADOWMAP_TYPE_PCF \)\s+uniform sampler2DShadow spotShadowMap\[ NUM_SPOT_LIGHT_SHADOWS \];/,
					`#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];`,
				);

				// 4. Replace the PCF getShadow function to use our PCSS
				// Match from the function signature to its closing brace
				const getShadowPCFRegex =
					/(#if defined\( SHADOWMAP_TYPE_PCF \)\s+float getShadow\( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord \) \{[\s\S]*?return mix\( 1\.0, shadow, shadowIntensity \);\s*\})/;

				shader = shader.replace(
					getShadowPCFRegex,
					`#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				return PCSS( shadowMap, shadowCoord, shadowIntensity );
			}
			return 1.0;
		}`,
				);

				THREE.ShaderChunk.shadowmap_pars_fragment = shader;
			} else {
				// Three.js < r182 uses RGBA-packed depth
				THREE.ShaderChunk.shadowmap_pars_fragment = THREE.ShaderChunk.shadowmap_pars_fragment
					.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP\n' + pcssLegacy(options))
					.replace(
						'#if defined( SHADOWMAP_TYPE_PCF )',
						'\nreturn PCSS(shadowMap, shadowCoord);\n#if defined( SHADOWMAP_TYPE_PCF )',
					);
			}

			reset(gl, scene, camera);

			onCleanup(() => {
				THREE.ShaderChunk.shadowmap_pars_fragment = original;
				reset(gl, scene, camera);
			});
		});
	}
}
