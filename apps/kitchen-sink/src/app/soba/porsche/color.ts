import { computed, signal } from "@angular/core";

export const color = signal("maroon");
export const colorAsHex = computed(() => toHex(color()));

// convert various colors values to hex
function toHex(value: string) {
	const ctx = document.createElement("canvas").getContext("2d")!;
	ctx.fillStyle = value;
	return ctx.fillStyle;
}
