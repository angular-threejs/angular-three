import { inject, Injectable, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { menus } from './constants';

@Injectable()
export class RockStore {
	private router = inject(Router);

	private initialRock = toSignal(
		this.router.events.pipe(
			filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd),
			map((ev) => ev.urlAfterRedirects),
			startWith(this.router.url),
			map((url) => menus.find((menu) => menu.path === url) || null),
		),
		{ initialValue: null },
	);

	selectedRock = linkedSignal(this.initialRock);
}
