/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*?includeContent' {
	import type { Type } from '@angular/core';
	const component: Type<any>;
	export const content: string;
	export default component;
}
