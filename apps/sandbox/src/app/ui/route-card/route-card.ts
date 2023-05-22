import { Platform } from '@angular/cdk/platform';
import { NgFor } from '@angular/common';
import { Component, Directive, ElementRef, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { RouteInfo } from '../../models/route-info';

@Directive({
    selector: 'video[sandboxAutoplay]',
    standalone: true,
    host: {
        '(mouseover)': 'onMouseOver()',
        '(mouseout)': 'onMouseOut()',
    },
})
class Autoplay {
    readonly #videoElementRef: ElementRef<HTMLVideoElement> = inject(ElementRef, { self: true });

    onMouseOver() {
        this.#videoElementRef.nativeElement.play().catch(() => {});
    }

    onMouseOut() {
        this.#videoElementRef.nativeElement.pause();
        this.#videoElementRef.nativeElement.currentTime = 0;
    }
}

@Component({
    selector: 'sandbox-route-card',
    standalone: true,
    templateUrl: 'route-card.html',
    imports: [NgFor, RouterLink, Autoplay],
    host: { class: 'card w-72 bg-base-100 shadow-xl pl-0 pt-0 pr-0 gap-0' },
})
export class RouteCard {
    @Input({ required: true }) route!: RouteInfo;
    readonly isIOS = inject(Platform).IOS;
}
