import { DOCUMENT } from '@angular/common';
import { inject, Pipe } from '@angular/core';

const RGBA_REGEX = /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d*\.?\d+)?\)/;
const DEFAULT_COLOR = 0x000000;

@Pipe({ name: 'hexify', pure: true })
export class NgtHexify {
	private document = inject(DOCUMENT, { optional: true });
	private ctx?: CanvasRenderingContext2D | null;
	private cache: Record<string, number> = {};

	/**
	 * transforms a:
	 * - hex string to a hex number
	 * - rgb string to a hex number
	 * - rgba string to a hex number
	 * - css color string to a hex number
	 *
	 * always default to black if failed
	 * @param value
	 */
	transform(value: string): number {
		if (value == null) return DEFAULT_COLOR;

		if (value.startsWith('#')) {
			if (!this.cache[value]) {
				this.cache[value] = this.hexStringToNumber(value);
			}
			return this.cache[value];
		}

		if (!this.ctx) {
			this.ctx = this.document?.createElement('canvas').getContext('2d');
		}

		if (!this.ctx) {
			console.warn('[NGT] hexify: canvas context is not available');
			return DEFAULT_COLOR;
		}

		this.ctx.fillStyle = value;
		const computedValue = this.ctx.fillStyle;

		if (computedValue.startsWith('#')) {
			if (!this.cache[computedValue]) {
				this.cache[computedValue] = this.hexStringToNumber(computedValue);
			}
			return this.cache[computedValue];
		}

		if (!computedValue.startsWith('rgba')) {
			console.warn(`[NGT] hexify: invalid color format. Expected rgba or hex, receive: ${computedValue}`);
			return DEFAULT_COLOR;
		}

		const match = computedValue.match(RGBA_REGEX);
		if (!match) {
			console.warn(`[NGT] hexify: invalid color format. Expected rgba or hex, receive: ${computedValue}`);
			return DEFAULT_COLOR;
		}

		const r = parseInt(match[1], 10);
		const g = parseInt(match[2], 10);
		const b = parseInt(match[3], 10);
		const a = match[4] ? parseFloat(match[4]) : 1.0;

		const cacheKey = `${r}:${g}:${b}:${a}`;

		// check result from cache
		if (!this.cache[cacheKey]) {
			// Convert the components to hex strings
			const hexR = this.componentToHex(r);
			const hexG = this.componentToHex(g);
			const hexB = this.componentToHex(b);
			const hexA = this.componentToHex(Math.round(a * 255));

			// Combine the hex components into a single hex string
			const hex = `#${hexR}${hexG}${hexB}${hexA}`;
			this.cache[cacheKey] = this.hexStringToNumber(hex);
		}

		return this.cache[cacheKey];
	}

	private hexStringToNumber(hexString: string): number {
		return parseInt(hexString.replace('#', ''), 16);
	}

	private componentToHex(component: number): string {
		const hex = component.toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	}
}
