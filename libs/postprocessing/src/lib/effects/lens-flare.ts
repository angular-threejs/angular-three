/**
 * Lens Flare Effect
 * Created by Anderson Mancini 2023
 * React Three Fiber Ultimate LensFlare - Ported to Angular Three
 */

import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
} from '@angular/core';
import { NgtArgs, NgtVector3, beforeRender, injectStore, is, omit, vector3 } from 'angular-three';
import { easing } from 'maath';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BlendFunction, Effect } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffectComposer } from '../effect-composer';

/**
 * Shader configuration for the lens flare effect.
 * Contains the GLSL fragment shader code.
 */
const LensFlareShader = {
	fragmentShader: /* language=glsl glsl */ `
    uniform float time;
    uniform vec2 lensPosition;
    uniform vec2 screenRes;
    uniform vec3 colorGain;
    uniform float starPoints;
    uniform float glareSize;
    uniform float flareSize;
    uniform float flareSpeed;
    uniform float flareShape;
    uniform float haloScale;
    uniform float opacity;
    uniform bool animated;
    uniform bool anamorphic;
    uniform bool enabled;
    uniform bool secondaryGhosts;
    uniform bool starBurst;
    uniform float ghostScale;
    uniform bool aditionalStreaks;
    uniform sampler2D lensDirtTexture;
    vec2 vTexCoord;

    float rand(float n){return fract(sin(n) * 43758.5453123);}

    float noise(float p){
      float fl = floor(p);
      float fc = fract(p);
      return mix(rand(fl),rand(fl + 1.0), fc);
    }

    vec3 hsv2rgb(vec3 c)
    {
      vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
      return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
    }

    float saturate(float x)
    {
      return clamp(x, 0.,1.);
    }

    vec2 rotateUV(vec2 uv, float rotation)
    {
      return vec2(
          cos(rotation) * uv.x + sin(rotation) * uv.y,
          cos(rotation) * uv.y - sin(rotation) * uv.x
      );
    }

    vec3 drawflare(vec2 p, float intensity, float rnd, float speed, int id)
    {
      float flarehueoffset = (1. / 32.) * float(id) * 0.1;
      float lingrad = distance(vec2(0.), p);
      float expgrad = 1. / exp(lingrad * (fract(rnd) * 0.66 + 0.33));
      vec3 colgrad = hsv2rgb(vec3( fract( (expgrad * 8.) + speed * flareSpeed + flarehueoffset), pow(1.-abs(expgrad*2.-1.), 0.45), 20.0 * expgrad * intensity));

      float internalStarPoints;

      if(anamorphic){
        internalStarPoints = 1.0;
      } else{
        internalStarPoints = starPoints;
      }

      float blades = length(p * flareShape * sin(internalStarPoints * atan(p.x, p.y)));

      float comp = pow(1.-saturate(blades), ( anamorphic ? 100. : 12.));
      comp += saturate(expgrad-0.9) * 3.;
      comp = pow(comp * expgrad, 8. + (1.-intensity) * 5.);

      if(flareSpeed > 0.0){
        return vec3(comp) * colgrad;
      } else{
        return vec3(comp) * flareSize * 15.;
      }
    }

    float dist(vec3 a, vec3 b) { return abs(a.x - b.x) + abs(a.y - b.y) + abs(a.z - b.z); }

    vec3 saturate(vec3 x)
    {
      return clamp(x, vec3(0.0), vec3(1.0));
    }

    float glare(vec2 uv, vec2 pos, float size)
    {
      vec2 main;

      if(animated){
        main = rotateUV(uv-pos, time * 0.1);
      } else{
        main = uv-pos;
      }

      float ang = atan(main.y, main.x) * (anamorphic ? 1.0 : starPoints);
      float dist = length(main);
      dist = pow(dist, .9);

      float f0 = 1.0/(length(uv-pos)*(1.0/size*16.0)+.2);

      return f0+f0*(sin((ang))*.2 +.3);
    }

    float sdHex(vec2 p){
      p = abs(p);
      vec2 q = vec2(p.x*2.0*0.5773503, p.y + p.x*0.5773503);
      return dot(step(q.xy,q.yx), 1.0-q.yx);
    }

    float fpow(float x, float k){
      return x > k ? pow((x-k)/(1.0-k),2.0) : 0.0;
    }

    vec3 renderhex(vec2 uv, vec2 p, float s, vec3 col){
      uv -= p;
      if (abs(uv.x) < 0.2*s && abs(uv.y) < 0.2*s){
          return mix(vec3(0),mix(vec3(0),col,0.1 + fpow(length(uv/s),0.1)*10.0),smoothstep(0.0,0.1,sdHex(uv*20.0/s)));
      }
      return vec3(0);
    }

    vec3 LensFlare(vec2 uv, vec2 pos)
    {
      vec2 main = uv-pos;
      vec2 uvd = uv*(length(uv));

      float ang = atan(main.x,main.y);

      float f0 = .3/(length(uv-pos)*16.0+1.0);

      f0 = f0*(sin(noise(sin(ang*3.9-(animated ? time : 0.0) * 0.3) * starPoints))*.2 );

      float f1 = max(0.01-pow(length(uv+1.2*pos),1.9),.0)*7.0;

      float f2 = max(.9/(10.0+32.0*pow(length(uvd+0.99*pos),2.0)),.0)*0.35;
      float f22 = max(.9/(11.0+32.0*pow(length(uvd+0.85*pos),2.0)),.0)*0.23;
      float f23 = max(.9/(12.0+32.0*pow(length(uvd+0.95*pos),2.0)),.0)*0.6;

      vec2 uvx = mix(uv,uvd, 0.1);

      float f4 = max(0.01-pow(length(uvx+0.4*pos),2.9),.0)*4.02;
      float f42 = max(0.0-pow(length(uvx+0.45*pos),2.9),.0)*4.1;
      float f43 = max(0.01-pow(length(uvx+0.5*pos),2.9),.0)*4.6;

      uvx = mix(uv,uvd,-.4);

      float f5 = max(0.01-pow(length(uvx+0.1*pos),5.5),.0)*2.0;
      float f52 = max(0.01-pow(length(uvx+0.2*pos),5.5),.0)*2.0;
      float f53 = max(0.01-pow(length(uvx+0.1*pos),5.5),.0)*2.0;

      uvx = mix(uv,uvd, 2.1);

      float f6 = max(0.01-pow(length(uvx-0.3*pos),1.61),.0)*3.159;
      float f62 = max(0.01-pow(length(uvx-0.325*pos),1.614),.0)*3.14;
      float f63 = max(0.01-pow(length(uvx-0.389*pos),1.623),.0)*3.12;

      vec3 c = vec3(glare(uv,pos, glareSize));

      vec2 prot;

      if(animated){
        prot = rotateUV(uv - pos, (time * 0.1));
      } else if(anamorphic){
        prot = rotateUV(uv - pos, 1.570796);
      } else {
        prot = uv - pos;
      }

      c += drawflare(prot, (anamorphic ? flareSize * 10. : flareSize), 0.1, time, 1);

      c.r+=f1+f2+f4+f5+f6; c.g+=f1+f22+f42+f52+f62; c.b+=f1+f23+f43+f53+f63;
      c = c*1.3 * vec3(length(uvd)+.09);
      c+=vec3(f0);

      return c;
    }

    vec3 cc(vec3 color, float factor,float factor2)
    {
      float w = color.x+color.y+color.z;
      return mix(color,vec3(w)*factor,w*factor2);
    }

    float rnd(vec2 p)
    {
      float f = fract(sin(dot(p, vec2(12.1234, 72.8392) )*45123.2));
      return f;
    }

    float rnd(float w)
    {
      float f = fract(sin(w)*1000.);
      return f;
    }

    float regShape(vec2 p, int N)
    {
      float f;

      float a=atan(p.x,p.y)+.2;
      float b=6.28319/float(N);
      f=smoothstep(.5,.51, cos(floor(.5+a/b)*b-a)*length(p.xy)* 2.0  -ghostScale);

      return f;
    }

    vec3 circle(vec2 p, float size, float decay, vec3 color, vec3 color2, float dist, vec2 position)
    {
      float l = length(p + position*(dist*2.))+size/2.;
      float l2 = length(p + position*(dist*4.))+size/3.;

      float c = max(0.01-pow(length(p + position*dist), size*ghostScale), 0.0)*10.;
      float c1 = max(0.001-pow(l-0.3, 1./40.)+sin(l*20.), 0.0)*3.;
      float c2 =  max(0.09/pow(length(p-position*dist/.5)*1., .95), 0.0)/20.;
      float s = max(0.02-pow(regShape(p*5. + position*dist*5. + decay, 6) , 1.), 0.0)*1.5;

      color = cos(vec3(0.44, .24, .2)*16. + dist/8.)*0.5+.5;
      vec3 f = c*color;
      f += c1*color;
      f += c2*color;
      f +=  s*color;
      return f;
    }

    vec4 getLensColor(float x){
      return vec4(vec3(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(vec3(0., 0., 0.),
        vec3(0., 0., 0.), smoothstep(0.0, 0.063, x)),
        vec3(0., 0., 0.), smoothstep(0.063, 0.125, x)),
        vec3(0.0, 0., 0.), smoothstep(0.125, 0.188, x)),
        vec3(0.188, 0.131, 0.116), smoothstep(0.188, 0.227, x)),
        vec3(0.31, 0.204, 0.537), smoothstep(0.227, 0.251, x)),
        vec3(0.192, 0.106, 0.286), smoothstep(0.251, 0.314, x)),
        vec3(0.102, 0.008, 0.341), smoothstep(0.314, 0.392, x)),
        vec3(0.086, 0.0, 0.141), smoothstep(0.392, 0.502, x)),
        vec3(1.0, 0.31, 0.0), smoothstep(0.502, 0.604, x)),
        vec3(.1, 0.1, 0.1), smoothstep(0.604, 0.643, x)),
        vec3(1.0, 0.929, 0.0), smoothstep(0.643, 0.761, x)),
        vec3(1.0, 0.086, 0.424), smoothstep(0.761, 0.847, x)),
        vec3(1.0, 0.49, 0.0), smoothstep(0.847, 0.89, x)),
        vec3(0.945, 0.275, 0.475), smoothstep(0.89, 0.941, x)),
        vec3(0.251, 0.275, 0.796), smoothstep(0.941, 1.0, x))),
      1.0);
    }

    float dirtNoise(vec2 p){
      vec2 f = fract(p);
      f = (f * f) * (3.0 - (2.0 * f));
      float n = dot(floor(p), vec2(1.0, 157.0));
      vec4 a = fract(sin(vec4(n + 0.0, n + 1.0, n + 157.0, n + 158.0)) * 43758.5453123);
      return mix(mix(a.x, a.y, f.x), mix(a.z, a.w, f.x), f.y);
    }

    float fbm(vec2 p){
      const mat2 m = mat2(0.80, -0.60, 0.60, 0.80);
      float f = 0.0;
      f += 0.5000*dirtNoise(p); p = m*p*2.02;
      f += 0.2500*dirtNoise(p); p = m*p*2.03;
      f += 0.1250*dirtNoise(p); p = m*p*2.01;
      f += 0.0625*dirtNoise(p);
      return f/0.9375;
    }

    vec4 getLensStar(vec2 p){
      vec2 pp = (p - vec2(0.5)) * 2.0;
      float a = atan(pp.y, pp.x);
      vec4 cp = vec4(sin(a * 1.0), length(pp), sin(a * 13.0), sin(a * 53.0));
      float d = sin(clamp(pow(length(vec2(0.5) - p) * 0.5 + haloScale /2., 5.0), 0.0, 1.0) * 3.14159);
      vec3 c = vec3(d) * vec3(fbm(cp.xy * 16.0) * fbm(cp.zw * 9.0) * max(max(max(max(0.5, sin(a * 1.0)), sin(a * 3.0) * 0.8), sin(a * 7.0) * 0.8), sin(a * 9.0) * 10.6));
      c *= vec3(mix(2.0, (sin(length(pp.xy) * 256.0) * 0.5) + 0.5, sin((clamp((length(pp.xy) - 0.875) / 0.1, 0.0, 1.0) + 0.0) * 2.0 * 3.14159) * 1.5) + 0.5) * 0.3275;
      return vec4(vec3(c * 1.0), d);
    }

    vec4 getLensDirt(vec2 p){
      p.xy += vec2(fbm(p.yx * 3.0), fbm(p.yx * 2.0)) * 0.0825;
      vec3 o = vec3(mix(0.125, 0.25, max(max(smoothstep(0.1, 0.0, length(p - vec2(0.25))),
                                            smoothstep(0.4, 0.0, length(p - vec2(0.75)))),
                                            smoothstep(0.8, 0.0, length(p - vec2(0.875, 0.125))))));
      o += vec3(max(fbm(p * 1.0) - 0.5, 0.0)) * 0.5;
      o += vec3(max(fbm(p * 2.0) - 0.5, 0.0)) * 0.5;
      o += vec3(max(fbm(p * 4.0) - 0.5, 0.0)) * 0.25;
      o += vec3(max(fbm(p * 8.0) - 0.75, 0.0)) * 1.0;
      o += vec3(max(fbm(p * 16.0) - 0.75, 0.0)) * 0.75;
      o += vec3(max(fbm(p * 64.0) - 0.75, 0.0)) * 0.5;
      return vec4(clamp(o, vec3(0.15), vec3(1.0)), 1.0);
    }

    vec4 textureLimited(sampler2D tex, vec2 texCoord){
      if(((texCoord.x < 0.) || (texCoord.y < 0.)) || ((texCoord.x > 1.) || (texCoord.y > 1.))){
        return vec4(0.0);
      }else{
        return texture(tex, texCoord);
      }
    }

    vec4 textureDistorted(sampler2D tex, vec2 texCoord, vec2 direction, vec3 distortion) {
      return vec4(textureLimited(tex, (texCoord + (direction * distortion.r))).r,
                  textureLimited(tex, (texCoord + (direction * distortion.g))).g,
                  textureLimited(tex, (texCoord + (direction * distortion.b))).b,
                  1.0);
    }

    vec4 getStartBurst(){
      vec2 aspectTexCoord = vec2(1.0) - (((vTexCoord - vec2(0.5)) * vec2(1.0)) + vec2(0.5));
      vec2 texCoord = vec2(1.0) - vTexCoord;
      vec2 ghostVec = (vec2(0.5) - texCoord) * 0.3 - lensPosition;
      vec2 ghostVecAspectNormalized = normalize(ghostVec * vec2(1.0)) * vec2(1.0);
      vec2 haloVec = normalize(ghostVec) * 0.6;
      vec2 haloVecAspectNormalized = ghostVecAspectNormalized * 0.6;
      vec2 texelSize = vec2(1.0) / vec2(screenRes.xy);
      vec3 distortion = vec3(-(texelSize.x * 1.5), 0.2, texelSize.x * 1.5);
      vec4 c = vec4(0.0);
      for (int i = 0; i < 8; i++) {
        vec2 offset = texCoord + (ghostVec * float(i));
        c += textureDistorted(lensDirtTexture, offset, ghostVecAspectNormalized, distortion) * pow(max(0.0, 1.0 - (length(vec2(0.5) - offset) / length(vec2(0.5)))), 10.0);
      }
      vec2 haloOffset = texCoord + haloVecAspectNormalized;
      return (c * getLensColor((length(vec2(0.5) - aspectTexCoord) / length(vec2(haloScale))))) +
            (textureDistorted(lensDirtTexture, haloOffset, ghostVecAspectNormalized, distortion) * pow(max(0.0, 1.0 - (length(vec2(0.5) - haloOffset) / length(vec2(0.5)))), 10.0));
    }

    void mainImage(vec4 inputColor, vec2 uv, out vec4 outputColor)
    {
      vec2 myUV = uv -0.5;
      myUV.y *= screenRes.y/screenRes.x;
      vec2 finalLensPosition = lensPosition * 0.5;
      finalLensPosition.y *= screenRes.y/screenRes.x;

      vec3 finalColor = LensFlare(myUV, finalLensPosition) * 20.0 * colorGain / 256.;

      if(aditionalStreaks){
        vec3 circColor = vec3(0.9, 0.2, 0.1);
        vec3 circColor2 = vec3(0.3, 0.1, 0.9);

        for(float i=0.;i<10.;i++){
          finalColor += circle(myUV, pow(rnd(i*2000.)*2.8, .1)+1.41, 0.0, circColor+i , circColor2+i, rnd(i*20.)*3.+0.2-.5, lensPosition);
        }
      }

      if(secondaryGhosts){
        vec3 altGhosts = vec3(0);
        altGhosts += renderhex(myUV, -lensPosition*0.25, ghostScale * 1.4, vec3(0.25,0.35,0));
        altGhosts += renderhex(myUV, lensPosition*0.25, ghostScale * 0.5, vec3(1,0.5,0.5));
        altGhosts += renderhex(myUV, lensPosition*0.1, ghostScale * 1.6, vec3(1,1,1));
        altGhosts += renderhex(myUV, lensPosition*1.8, ghostScale * 2.0, vec3(0,0.5,0.75));
        altGhosts += renderhex(myUV, lensPosition*1.25, ghostScale * 0.8, vec3(1,1,0.5));
        altGhosts += renderhex(myUV, -lensPosition*1.25, ghostScale * 5.0, vec3(0.5,0.5,0.25));

        altGhosts += fpow(1.0 - abs(distance(lensPosition*0.8,myUV) - 0.7),0.985)*colorGain / 2100.;
        finalColor += altGhosts;
      }

      if(starBurst){
        vTexCoord = myUV + 0.5;
        vec4 lensMod = getLensDirt(myUV);
        float tooBright = 1.0 - (clamp(0.5, 0.0, 0.5) * 2.0);
        float tooDark = clamp(0.5 - 0.5, 0.0, 0.5) * 2.0;
        lensMod += mix(lensMod, pow(lensMod * 2.0, vec4(2.0)) * 0.5, tooBright);
        float lensStarRotationAngle = ((myUV.x + myUV.y)) * (1.0 / 6.0);
        vec2 lensStarTexCoord = (mat2(cos(lensStarRotationAngle), -sin(lensStarRotationAngle), sin(lensStarRotationAngle), cos(lensStarRotationAngle)) * vTexCoord);
        lensMod += getLensStar(lensStarTexCoord) * 2.;

        finalColor += clamp((lensMod.rgb * getStartBurst().rgb ), 0.01, 1.0);
      }

      if(enabled){
        outputColor = vec4(mix(finalColor, vec3(.0), opacity) + inputColor.rgb, inputColor.a);
      } else {
        outputColor = vec4(inputColor);
      }
    }
`,
};

/**
 * A postprocessing effect that simulates camera lens flares.
 *
 * Creates realistic lens flare effects including glare, ghosts, star bursts,
 * and anamorphic flares. Can be animated and positioned dynamically.
 *
 * @example
 * ```typescript
 * const effect = new LensFlareEffect({
 *   glareSize: 0.3,
 *   starPoints: 8,
 *   animated: true
 * });
 * ```
 */
export class LensFlareEffect extends Effect {
	/**
	 * Creates a new LensFlareEffect instance.
	 *
	 * @param options - Configuration options for the lens flare
	 * @param options.blendFunction - How to blend with the scene
	 * @param options.enabled - Whether the effect is enabled
	 * @param options.glareSize - Size of the glare
	 * @param options.lensPosition - Position of the lens on screen
	 * @param options.screenRes - Resolution of the effect
	 * @param options.starPoints - Number of points in the star pattern
	 * @param options.flareSize - Size of individual flares
	 * @param options.flareSpeed - Animation speed of flares
	 * @param options.flareShape - Shape parameter for flares
	 * @param options.animated - Whether to animate the effect
	 * @param options.anamorphic - Enable anamorphic lens simulation
	 * @param options.colorGain - Color tint for the effect
	 * @param options.lensDirtTexture - Texture for lens dirt overlay
	 * @param options.haloScale - Scale of the halo effect
	 * @param options.secondaryGhosts - Enable secondary ghost images
	 * @param options.aditionalStreaks - Enable additional streak effects
	 * @param options.ghostScale - Scale of ghost images
	 * @param options.opacity - Opacity of the effect
	 * @param options.starBurst - Enable star burst effect
	 */
	constructor({
		blendFunction = BlendFunction.NORMAL,
		enabled = true,
		glareSize = 0.2,
		lensPosition = [0.01, 0.01],
		screenRes = [0, 0],
		starPoints = 6,
		flareSize = 0.01,
		flareSpeed = 0.01,
		flareShape = 0.01,
		animated = true,
		anamorphic = false,
		colorGain = new THREE.Color(20, 20, 20),
		lensDirtTexture = null as THREE.Texture | null,
		haloScale = 0.5,
		secondaryGhosts = true,
		aditionalStreaks = true,
		ghostScale = 0.0,
		opacity = 1.0,
		starBurst = false,
	} = {}) {
		super('LensFlareEffect', LensFlareShader.fragmentShader, {
			blendFunction,
			uniforms: new Map<string, THREE.Uniform>([
				['enabled', new THREE.Uniform(enabled)],
				['glareSize', new THREE.Uniform(glareSize)],
				['lensPosition', new THREE.Uniform(lensPosition)],
				['time', new THREE.Uniform(0)],
				['screenRes', new THREE.Uniform(screenRes)],
				['starPoints', new THREE.Uniform(starPoints)],
				['flareSize', new THREE.Uniform(flareSize)],
				['flareSpeed', new THREE.Uniform(flareSpeed)],
				['flareShape', new THREE.Uniform(flareShape)],
				['animated', new THREE.Uniform(animated)],
				['anamorphic', new THREE.Uniform(anamorphic)],
				['colorGain', new THREE.Uniform(colorGain)],
				['lensDirtTexture', new THREE.Uniform(lensDirtTexture)],
				['haloScale', new THREE.Uniform(haloScale)],
				['secondaryGhosts', new THREE.Uniform(secondaryGhosts)],
				['aditionalStreaks', new THREE.Uniform(aditionalStreaks)],
				['ghostScale', new THREE.Uniform(ghostScale)],
				['starBurst', new THREE.Uniform(starBurst)],
				['opacity', new THREE.Uniform(opacity)],
			]),
		});
	}

	/**
	 * Updates the effect's time uniform for animation.
	 *
	 * @param _renderer - The WebGL renderer (unused)
	 * @param _inputBuffer - The input render target (unused)
	 * @param deltaTime - Time elapsed since last frame
	 */
	override update(_renderer: THREE.WebGLRenderer, _inputBuffer: THREE.WebGLRenderTarget, deltaTime: number) {
		const time = this.uniforms.get('time');
		if (time) {
			time.value += deltaTime;
		}
	}
}

/**
 * Configuration options for the Angular lens flare component.
 * Extends LensFlareEffect options with position and mouse tracking.
 */
export type LensFlareOptions = ConstructorParameters<typeof LensFlareEffect>[0] & {
	/** World position of the light source for the flare */
	position: NgtVector3;
	/** Whether the flare should follow the mouse cursor */
	followMouse: boolean;
	/** Smoothing time for opacity transitions */
	smoothTime: number;
};

const defaultOptions: LensFlareOptions = {
	position: new THREE.Vector3(-25, 6, -60),
	followMouse: false,
	smoothTime: 0.7,
};

/**
 * Angular component that applies a lens flare effect to the scene.
 *
 * This effect simulates realistic camera lens flares with support for
 * dynamic positioning, mouse following, and occlusion detection.
 * The flare automatically fades when occluded by scene objects.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-lens-flare [options]="{ position: [10, 5, -20], glareSize: 0.3 }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Mouse-following flare -->
 * <ngtp-effect-composer>
 *   <ngtp-lens-flare [options]="{ followMouse: true, smoothTime: 0.5 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-lens-flare',
	template: `
		<ngt-primitive *args="[effect()]" [parameters]="{ dispose: null }" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpLensFlare {
	/**
	 * Configuration options for the lens flare effect.
	 * @see LensFlareOptions
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private store = injectStore();

	private effectComposer = inject(NgtpEffectComposer);

	private effectOptions = omit(this.options, ['position', 'followMouse', 'smoothTime']);
	private position = vector3(this.options, 'position');

	/** Cached vector for projecting 3D position to screen space */
	private projectedPosition = new THREE.Vector3();

	/** Cached vector for 2D mouse/raycaster coordinates */
	private mouse2d = new THREE.Vector2();

	/** The underlying LensFlareEffect instance */
	effect = computed(() => new LensFlareEffect(this.effectOptions()));

	constructor() {
		effect(() => {
			const [lensFlareEffect, width, height] = [
				this.effect(),
				this.store.viewport.width(),
				this.store.viewport.height(),
			];
			const screenRes = lensFlareEffect.uniforms.get('screenRes');
			if (screenRes) {
				screenRes.value.x = width;
				screenRes.value.y = height;
			}
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});

		beforeRender(({ delta }) => {
			const [effect] = [this.effect()];
			if (!effect) return;

			const [{ followMouse, smoothTime }, position, pointer, camera, scene, raycaster] = [
				this.options(),
				this.position(),
				this.store.snapshot.pointer,
				this.effectComposer.camera(),
				this.effectComposer.scene(),
				this.store.snapshot.raycaster,
			];

			const uLensPosition = effect.uniforms.get('lensPosition');
			const uOpacity = effect.uniforms.get('opacity');
			if (!uLensPosition || !uOpacity) return;

			let target = 1;

			if (followMouse) {
				uLensPosition.value.x = pointer.x;
				uLensPosition.value.y = pointer.y;
				target = 0;
			} else {
				this.projectedPosition.copy(position).project(camera);
				if (this.projectedPosition.z > 1) return;

				uLensPosition.value.x = this.projectedPosition.x;
				uLensPosition.value.y = this.projectedPosition.y;

				this.mouse2d.set(this.projectedPosition.x, this.projectedPosition.y);
				raycaster.setFromCamera(this.mouse2d, camera);
				const intersects = raycaster.intersectObjects(scene.children, true);
				const { object } = intersects[0] ?? {};
				if (object) {
					if (object.userData?.['lensflare'] === 'no-occlusion') {
						target = 0;
					} else if (is.three<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(object, 'isMesh')) {
						if (object.material.uniforms?.['_transmission']?.value > 0.2) {
							//Check for MeshTransmissionMaterial
							target = 0.2;
						} else if (
							'_transmission' in object.material &&
							typeof object.material._transmission === 'number' &&
							object.material._transmission > 0.2
						) {
							//Check for MeshPhysicalMaterial with transmission setting
							target = 0.2;
						} else if (object.material.transparent) {
							// Check for OtherMaterials with transparent parameter
							target = object.material.opacity;
						}
					}
				}
			}

			easing.damp(uOpacity, 'value', target, smoothTime, delta);
		});
	}
}
