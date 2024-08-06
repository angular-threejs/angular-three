import { DOCUMENT } from '@angular/common';
import { inject, Pipe } from '@angular/core';

@Pipe({ name: 'hexify', pure: true, standalone: true })
export class NgtHexify {
	private document = inject(DOCUMENT, { optional: true });
	private ctx?: CanvasRenderingContext2D | null;

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
		if (value == null) return 0x000000;

		if (value.startsWith('#')) {
			return this.hexStringToNumber(value);
		}

		if (!this.ctx) {
			this.ctx = this.document?.createElement('canvas').getContext('2d');
		}

		if (!this.ctx) return 0x000000;

		this.ctx.fillStyle = value;
		const computedValue = this.ctx.fillStyle;

		if (computedValue.startsWith('#')) {
			return this.hexStringToNumber(computedValue);
		}

		if (!computedValue.startsWith('rgba')) return 0x000000;

		const regex = /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d*\.?\d+)?\)/;
		const match = computedValue.match(regex);
		if (!match) return 0x000000;

		const r = parseInt(match[1], 10);
		const g = parseInt(match[2], 10);
		const b = parseInt(match[3], 10);
		const a = match[4] ? parseFloat(match[4]) : 1.0;

		// Convert the components to hex strings
		const hexR = this.componentToHex(r);
		const hexG = this.componentToHex(g);
		const hexB = this.componentToHex(b);
		const hexA = this.componentToHex(Math.round(a * 255));

		// Combine the hex components into a single hex string
		const hex = `#${hexR}${hexG}${hexB}${hexA}`;
		return this.hexStringToNumber(hex);
	}

	private hexStringToNumber(hexString: string): number {
		return parseInt(hexString.replace('#', ''), 16);
	}

	private componentToHex(component: number): string {
		const hex = component.toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	}
}
