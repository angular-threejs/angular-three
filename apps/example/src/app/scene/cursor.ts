import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, OnInit, Renderer2 } from '@angular/core';
import { getLocalState, injectNgtDestroy } from 'angular-three';

@Directive({ selector: 'ngt-mesh[cursorPointer]', standalone: true })
export class CursorPointer implements OnInit {
    private readonly elementRef = inject(ElementRef) as ElementRef<THREE.Mesh>;
    private readonly renderer = inject(Renderer2);
    private readonly document = inject(DOCUMENT);
    private pointerOver?: () => void;
    private pointerOut?: () => void;

    constructor() {
        injectNgtDestroy(() => {
            this.pointerOver?.();
            this.pointerOut?.();
        });
    }

    ngOnInit() {
        const localState = getLocalState(this.elementRef.nativeElement);

        if (localState.eventCount) {
            const originalPointerOver = localState.handlers.pointerover;
            this.pointerOver = this.renderer.listen(this.elementRef.nativeElement, 'pointerover', (event) => {
                this.document.body.style.cursor = 'pointer';
                originalPointerOver?.(event);
            });

            const originalPointerOut = localState.handlers.pointerout;
            this.pointerOut = this.renderer.listen(this.elementRef.nativeElement, 'pointerout', (event) => {
                this.document.body.style.cursor = 'auto';
                originalPointerOut?.(event);
            });
        }
    }
}
