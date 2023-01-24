import { Platform } from '@angular/cdk/platform';
import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, ElementRef, HostListener, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { routes } from '../app.routes';

interface Demo {
    description: string;
    link: string;
    asset: string;
}

@Directive({
    selector: 'video[demoAutoplay]',
    standalone: true,
})
export class Autoplay {
    private readonly videoElementRef: ElementRef<HTMLVideoElement> = inject(ElementRef, { self: true });

    @HostListener('mouseover')
    onMouseOver() {
        this.videoElementRef.nativeElement.play().catch(() => {});
    }

    @HostListener('mouseout')
    onMouseOut() {
        this.videoElementRef.nativeElement.pause();
        this.videoElementRef.nativeElement.currentTime = 0;
    }
}

@Component({
    selector: 'demo-home-demo-item',
    standalone: true,
    template: `
        <a [routerLink]="[demo.link]">
            <video
                demoAutoplay
                muted
                playsinline
                class="w-full h-full max-h-48 object-cover cursor-pointer"
                [title]="demo.description"
                [poster]="isIOS ? demo.asset + '.gif' : ''"
            >
                <source
                    *ngFor="let source of ['webm', 'mp4']"
                    [src]="demo.asset + '.' + source"
                    [type]="'video/' + source"
                />
                <img
                    class="w-full h-full max-h-48 object-cover cursor-pointer"
                    [src]="demo.asset + '.gif'"
                    [alt]="demo.description"
                    loading="lazy"
                />
            </video>
        </a>
    `,
    imports: [Autoplay, NgFor, RouterLink],
    host: { class: 'space-y-6 xl:space-y-10 relative block w-full h-full' },
})
export class DemoItem {
    @Input() demo!: Demo;

    readonly isIOS = inject(Platform).IOS;
}

@Component({
    selector: 'demo-home-demo-list',
    standalone: true,
    template: `
        <ul role="list" class="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0 lg:grid-cols-3 lg:gap-8">
            <li
                *ngFor="let demo of demos"
                class="bg-black rounded-xl overflow-hidden xl:text-left flex justify-center items-center"
            >
                <demo-home-demo-item [demo]="demo" />
            </li>
        </ul>
    `,
    imports: [NgFor, DemoItem],
})
export class DemoList {
    readonly demos = routes.filter((route) => !!route.data).map((route) => route.data) as Demo[];
}

@Component({
    selector: 'demo-home-header',
    standalone: true,
    template: `
        <h2 class="text-3xl font-bold text-gray-800 tracking-tight sm:text-4xl">Angular Three Demos</h2>
        <p class="text-xl text-gray-600">
            Here are some example of things you can do with
            <a href="https://github.com/angular-threejs/angular-three/tree/main/apps/demo" class="hover:underline">
                <strong>AngularThree</strong>
            </a>
        </p>
    `,
    host: { class: 'space-y-5 sm:space-y-4 md:max-w-xl lg:max-w-3xl xl:max-w-none block mb-4' },
})
export class Header {}

@Component({
    standalone: true,
    template: `
        <small class="absolute right-4 font-xs italic">
            * Interact (click anywhere) on the page to enable example play on hover
        </small>
        <div class="header-background bg-white">
            <div class="mx-auto py-12 px-4 max-w-7xl sm:px-6 lg:px-8 lg:py-24">
                <demo-home-header />
                <demo-home-demo-list />
            </div>
        </div>
    `,
    imports: [Header, DemoList],
    styles: [
        `
            .header-background {
                background-image: url(../../assets/header-background.svg);
                background-size: contain;
                background-repeat: repeat;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {}
