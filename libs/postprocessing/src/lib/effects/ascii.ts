import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Effect } from 'postprocessing';
import * as THREE from 'three';

/**
 * Fragment shader for the ASCII effect.
 * Converts the scene into ASCII character representation based on pixel brightness.
 */
const fragment = /* language=glsl glsl */ `
uniform sampler2D uCharacters;
uniform float uCharactersCount;
uniform float uCellSize;
uniform bool uInvert;
uniform vec3 uColor;

const vec2 SIZE = vec2(16.);

vec3 greyscale(vec3 color, float strength) {
    float g = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(g), strength);
}

vec3 greyscale(vec3 color) {
    return greyscale(color, 1.0);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 cell = resolution / uCellSize;
    vec2 grid = 1.0 / cell;
    vec2 pixelizedUV = grid * (0.5 + floor(uv / grid));
    vec4 pixelized = texture2D(inputBuffer, pixelizedUV);
    float greyscaled = greyscale(pixelized.rgb).r;

    if (uInvert) {
        greyscaled = 1.0 - greyscaled;
    }

    float characterIndex = floor((uCharactersCount - 1.0) * greyscaled);
    vec2 characterPosition = vec2(mod(characterIndex, SIZE.x), floor(characterIndex / SIZE.y));
    vec2 offset = vec2(characterPosition.x, -characterPosition.y) / SIZE;
    vec2 charUV = mod(uv * (cell / SIZE), 1.0 / SIZE) - vec2(0., 1.0 / SIZE) + offset;
    vec4 asciiCharacter = texture2D(uCharacters, charUV);

    asciiCharacter.rgb = uColor * asciiCharacter.r;
    asciiCharacter.a = pixelized.a;
    outputColor = asciiCharacter;
}
`;

/**
 * Configuration options for the ASCII effect.
 */
interface ASCIIEffectOptions {
	/**
	 * The font family to use for rendering characters.
	 * @default 'arial'
	 */
	font?: string;

	/**
	 * The character set to use for rendering, ordered from darkest to brightest.
	 * @default " .:,'-^=*+?!|0#X%WM@"
	 */
	characters?: string;

	/**
	 * The font size in pixels for the character texture.
	 * @default 54
	 */
	fontSize?: number;

	/**
	 * The size of each cell in pixels.
	 * @default 16
	 */
	cellSize?: number;

	/**
	 * The color of the ASCII characters in hex format.
	 * @default '#ffffff'
	 */
	color?: string;

	/**
	 * Whether to invert the brightness mapping.
	 * @default false
	 */
	invert?: boolean;
}

/**
 * A postprocessing effect that renders the scene as ASCII art.
 *
 * This effect converts the rendered scene into a grid of ASCII characters,
 * where the character used depends on the brightness of the underlying pixels.
 *
 * @example
 * ```typescript
 * const effect = new ASCIIEffect({
 *   cellSize: 12,
 *   color: '#00ff00',
 *   characters: ' .:-=+*#%@'
 * });
 * ```
 */
export class ASCIIEffect extends Effect {
	constructor({
		font = 'arial',
		characters = ` .:,'-^=*+?!|0#X%WM@`,
		fontSize = 54,
		cellSize = 16,
		color = '#ffffff',
		invert = false,
	}: ASCIIEffectOptions = {}) {
		const uniforms = new Map<string, THREE.Uniform>([
			['uCharacters', new THREE.Uniform(new THREE.Texture())],
			['uCellSize', new THREE.Uniform(cellSize)],
			['uCharactersCount', new THREE.Uniform(characters.length)],
			['uColor', new THREE.Uniform(new THREE.Color(color))],
			['uInvert', new THREE.Uniform(invert)],
		]);

		super('ASCIIEffect', fragment, { uniforms });

		const charactersTextureUniform = this.uniforms.get('uCharacters');

		if (charactersTextureUniform) {
			charactersTextureUniform.value = this.createCharactersTexture(characters, font, fontSize);
		}
	}

	/**
	 * Creates a texture containing all the ASCII characters.
	 *
	 * Draws each character in the character set onto a canvas and creates
	 * a texture that can be sampled in the shader.
	 *
	 * @param characters - The character set to render
	 * @param font - The font family to use
	 * @param fontSize - The font size in pixels
	 * @returns A Three.js texture containing the rendered characters
	 */
	public createCharactersTexture(characters: string, font: string, fontSize: number): THREE.Texture {
		const canvas = document.createElement('canvas');
		const SIZE = 1024;
		const MAX_PER_ROW = 16;
		const CELL = SIZE / MAX_PER_ROW;

		canvas.width = canvas.height = SIZE;
		const texture = new THREE.CanvasTexture(
			canvas,
			undefined,
			THREE.RepeatWrapping,
			THREE.RepeatWrapping,
			THREE.NearestFilter,
			THREE.NearestFilter,
		);
		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('Context not available');
		}

		context.clearRect(0, 0, SIZE, SIZE);
		context.font = `${fontSize}px ${font}`;
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillStyle = '#fff';

		for (let i = 0; i < characters.length; i++) {
			const char = characters[i];
			const x = i % MAX_PER_ROW;
			const y = Math.floor(i / MAX_PER_ROW);
			context.fillText(char, x * CELL + CELL / 2, y * CELL + CELL / 2);
		}

		texture.needsUpdate = true;
		return texture;
	}
}

const defaultOptions: ASCIIEffectOptions = {
	font: 'arial',
	characters: ` .:,'-^=*+?!|0#X%WM@`,
	fontSize: 54,
	cellSize: 16,
	color: '#ffffff',
	invert: false,
};

/**
 * Angular component that applies an ASCII art postprocessing effect to the scene.
 *
 * Renders the scene as ASCII characters, where character selection is based on
 * the brightness of the underlying pixels.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-ascii [options]="{ cellSize: 12, color: '#00ff00' }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-ascii',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpASCII {
	/**
	 * Configuration options for the ASCII effect.
	 * @see ASCIIEffectOptions
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	/** The underlying ASCIIEffect instance */
	effect = computed(() => new ASCIIEffect(this.options()));

	constructor() {
		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
