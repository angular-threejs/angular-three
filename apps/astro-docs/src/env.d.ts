/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.analog' {
	import type { Type } from '@angular/core';
	const component: Type<any>;
	export default component;
}
