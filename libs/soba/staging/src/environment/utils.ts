import {
    ChangeDetectorRef,
    DestroyRef,
    ElementRef,
    Injector,
    computed,
    effect,
    inject,
    runInInjectionContext,
} from '@angular/core';
import { assertInjectionContext, injectNgtLoader, injectNgtRef, is, safeDetectChanges } from 'angular-three';
import {
    CubeReflectionMapping,
    CubeTexture,
    CubeTextureLoader,
    EquirectangularReflectionMapping,
    LinearEncoding,
    sRGBEncoding,
} from 'three';
import { RGBELoader } from 'three-stdlib';
import { ngtsEnvironmentPresetsObj } from './assets';
import { type NgtsEnvironmentInput } from './environment-input';

function resolveScene(scene: THREE.Scene | ElementRef<THREE.Scene>) {
    return is.ref(scene) ? scene.nativeElement : scene;
}

export function setEnvProps(
    background: boolean | 'only',
    scene: THREE.Scene | ElementRef<THREE.Scene> | undefined,
    defaultScene: THREE.Scene,
    texture: THREE.Texture,
    blur = 0
) {
    const target = resolveScene(scene || defaultScene);
    const oldbg = target.background;
    const oldenv = target.environment;
    const oldBlur = target.backgroundBlurriness || 0;

    if (background !== 'only') target.environment = texture;
    if (background) target.background = texture;
    if (background && target.backgroundBlurriness !== undefined) target.backgroundBlurriness = blur;

    return () => {
        if (background !== 'only') target.environment = oldenv;
        if (background) target.background = oldbg;
        if (background && target.backgroundBlurriness !== undefined) target.backgroundBlurriness = oldBlur;
    };
}

type NgtsInjectEnvironmentParams = Partial<
    Pick<NgtsEnvironmentInput, 'files' | 'path' | 'preset' | 'extensions' | 'encoding'>
>;

const CUBEMAP_ROOT = 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/hdris/';
export function injectNgtsEnvironment(paramsFactory: () => Partial<NgtsInjectEnvironmentParams>, injector?: Injector) {
    injector = assertInjectionContext(injectNgtsEnvironment, injector);
    return runInInjectionContext(injector, () => {
        const cdr = inject(ChangeDetectorRef);
        const textureRef = injectNgtRef<THREE.Texture | CubeTexture>();

        inject(DestroyRef).onDestroy(() => {
            textureRef.untracked.dispose();
        });

        const params = computed(() => {
            let { files, preset, encoding, path, extensions } = paramsFactory() as NgtsInjectEnvironmentParams;

            if (files == null) {
                files = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'];
            }

            if (path == null) {
                path = '';
            }

            if (preset) {
                if (!(preset in ngtsEnvironmentPresetsObj))
                    throw new Error('Preset must be one of: ' + Object.keys(ngtsEnvironmentPresetsObj).join(', '));
                files = ngtsEnvironmentPresetsObj[preset];
                path = CUBEMAP_ROOT;
            }

            return { files, preset, encoding, path, extensions } as NgtsInjectEnvironmentParams;
        });

        const loaderResult = injectNgtLoader(
            // @ts-expect-error
            () => {
                const { files } = params();
                return Array.isArray(files) ? CubeTextureLoader : RGBELoader;
            },
            () => {
                const { files } = params();
                return Array.isArray(files) ? [files] : files;
            },
            {
                extensions: (loader) => {
                    const { path, extensions } = params();
                    loader.setPath(path);
                    if (extensions) extensions(loader);
                },
            }
        );

        effect(
            () => {
                const result = loaderResult();
                if (!result) return;
                const { files, encoding } = params();
                const texture: THREE.Texture | THREE.CubeTexture = Array.isArray(files) ? result[0] : result;
                texture.mapping = Array.isArray(files) ? CubeReflectionMapping : EquirectangularReflectionMapping;
                texture.encoding = encoding ?? Array.isArray(files) ? sRGBEncoding : LinearEncoding;

                textureRef.nativeElement = texture;
                safeDetectChanges(cdr);
            },
            { allowSignalWrites: true }
        );

        return textureRef;
    });
}
