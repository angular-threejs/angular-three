## 2.5.1 (2024-09-30)


### 🩹 Fixes

- **plugin:** bump generators versions ([572477d](https://github.com/angular-threejs/angular-three/commit/572477d))
- **rapier:** do not track entire options object in rigid body colliders options ([8c7915a](https://github.com/angular-threejs/angular-three/commit/8c7915a))
- **soba:** bump dependencies version ([1c9b7cb](https://github.com/angular-threejs/angular-three/commit/1c9b7cb))

### ❤️  Thank You

- nartc

## 2.5.0 (2024-09-30)


### 🚀 Features

- **soba:** add preload ([8387f21](https://github.com/angular-threejs/angular-three/commit/8387f21))

### 🩹 Fixes

- **core:** use findIndex instead of indexOf in instance add new object ([0ae843f](https://github.com/angular-threejs/angular-three/commit/0ae843f))
- **soba:** use textGeometry in effect for text3d ([eaa2d17](https://github.com/angular-threejs/angular-three/commit/eaa2d17))

### ❤️  Thank You

- nartc

## 2.4.0 (2024-09-29)


### 🚀 Features

- use ngxtension ([f785e1d](https://github.com/angular-threejs/angular-three/commit/f785e1d))
- add select to storeApi ([9d5da39](https://github.com/angular-threejs/angular-three/commit/9d5da39))
- adjust migration ([04d2924](https://github.com/angular-threejs/angular-three/commit/04d2924))
- **core:** generate core ([e1cf6c7](https://github.com/angular-threejs/angular-three/commit/e1cf6c7))
- **core:** upgrade nx ([c3bbc46](https://github.com/angular-threejs/angular-three/commit/c3bbc46))
- **core:** add experience generation (beta) ([650eb26](https://github.com/angular-threejs/angular-three/commit/650eb26))
- **core:** update nx ([27ca571](https://github.com/angular-threejs/angular-three/commit/27ca571))
- **core:** bump three 0.156 ([3f847ef](https://github.com/angular-threejs/angular-three/commit/3f847ef))
- **core:** update nx ([3e55988](https://github.com/angular-threejs/angular-three/commit/3e55988))
- **core:** update ngxtension ([f3bbd0c](https://github.com/angular-threejs/angular-three/commit/f3bbd0c))
- **core:** add selection api (NgtSelection and NgtSelect) ([b3c2071](https://github.com/angular-threejs/angular-three/commit/b3c2071))
- **core:** add hexify pipe to convert various color values to hex-number (0xRRGGBBAA format) ([0f2c63a](https://github.com/angular-threejs/angular-three/commit/0f2c63a))
- **core:** add NgtObjectEvents directive to pass-through pointer event system ([e0b575f](https://github.com/angular-threejs/angular-three/commit/e0b575f))
- **core:** add injectNonNullish$ ([2eec63b](https://github.com/angular-threejs/angular-three/commit/2eec63b))
- **core:** allow raycast to accept null and assign () => null for null raycasting ([44b24e8](https://github.com/angular-threejs/angular-three/commit/44b24e8))
- **core:** init nativescript entry point ([413a60c](https://github.com/angular-threejs/angular-three/commit/413a60c))
- **core:** first nativescript entry point release ([8864e0b](https://github.com/angular-threejs/angular-three/commit/8864e0b))
- **plugin:** update init-soba generator to add metadata.json ([6009ca0](https://github.com/angular-threejs/angular-three/commit/6009ca0))
- **plugin:** update plugin to the latest ([b13ef25](https://github.com/angular-threejs/angular-three/commit/b13ef25))
- **plugin:** add soba generator ([591e95a](https://github.com/angular-threejs/angular-three/commit/591e95a))
- **plugin:** wip gltf generator ([08a7baa](https://github.com/angular-threejs/angular-three/commit/08a7baa))
- **postprocessing:** add outline effect and demo ([30f70ba](https://github.com/angular-threejs/angular-three/commit/30f70ba))
- **postprocessing:** add n8ao as an entry point; add tonemapping ([7c73755](https://github.com/angular-threejs/angular-three/commit/7c73755))
- **rapier:** add rapier ([ff76de7](https://github.com/angular-threejs/angular-three/commit/ff76de7))
- **rapier:** add rapier ([#54](https://github.com/angular-threejs/angular-three/pull/54))
- ⚠️  **rapier:** support fallback content when physics fails to load RAPIER wasm ([8f336df](https://github.com/angular-threejs/angular-three/commit/8f336df))
- **soba:** add instances ([e118791](https://github.com/angular-threejs/angular-three/commit/e118791))
- **soba:** gizmo ([8ac565c](https://github.com/angular-threejs/angular-three/commit/8ac565c))
- **soba:** allow set global decoder path ([cbe0cc4](https://github.com/angular-threejs/angular-three/commit/cbe0cc4))
- **soba:** point material ([c57dcea](https://github.com/angular-threejs/angular-three/commit/c57dcea))
- **soba:** add scale factor calculation for pivot controls ([1d00903](https://github.com/angular-threejs/angular-three/commit/1d00903))
- **soba:** add pivot controls ([2729b57](https://github.com/angular-threejs/angular-three/commit/2729b57))
- **soba:** add billboard ([91c51cf](https://github.com/angular-threejs/angular-three/commit/91c51cf))
- **soba:** add NgtsMask ([a60e3b7](https://github.com/angular-threejs/angular-three/commit/a60e3b7))
- **soba:** add transform controls ([faf6867](https://github.com/angular-threejs/angular-three/commit/faf6867))
- **soba:** gen gizmos entry; move PivotControls and TransformControls into gizmos ([9e82df2](https://github.com/angular-threejs/angular-three/commit/9e82df2))
- **soba:** add gizmo helpers ([f99d043](https://github.com/angular-threejs/angular-three/commit/f99d043))

### 🩹 Fixes

- migration migrates all the times ([83ca9c6](https://github.com/angular-threejs/angular-three/commit/83ca9c6))
- make sure to install ngxtension ([6ee16a7](https://github.com/angular-threejs/angular-three/commit/6ee16a7))
- adjust version of ngxtension ([7c5b54a](https://github.com/angular-threejs/angular-three/commit/7c5b54a))
- only get state if it's available ([33aa00f](https://github.com/angular-threejs/angular-three/commit/33aa00f))
- ⚠️  **cannon:** unwrap `afterNextRender` from `injectBody` and `injectConstraint` ([676aa16](https://github.com/angular-threejs/angular-three/commit/676aa16))
- **cannon:** update peer deps ([fc7ab35](https://github.com/angular-threejs/angular-three/commit/fc7ab35))
- **cannon:** remove autoEffect in physics ([7ecfb3f](https://github.com/angular-threejs/angular-three/commit/7ecfb3f))
- **cannon:** clean up physics ([f8973c4](https://github.com/angular-threejs/angular-three/commit/f8973c4))
- **core:** make sure renderer work correctly for two DOMs elements that might contain THREE children ([b1987ba](https://github.com/angular-threejs/angular-three/commit/b1987ba))
- **core:** only proceed with append logic for DOMs if render state is available ([5a56e6d](https://github.com/angular-threejs/angular-three/commit/5a56e6d))
- **core:** adjust createAttachFn positional type arguments ([b65fe57](https://github.com/angular-threejs/angular-three/commit/b65fe57))
- **core:** adjust experience generator ([fad08f6](https://github.com/angular-threejs/angular-three/commit/fad08f6))
- **core:** adjust generator sourceRoot ([701b7c9](https://github.com/angular-threejs/angular-three/commit/701b7c9))
- **core:** adjust tsqueyr usage for generator ([2d16772](https://github.com/angular-threejs/angular-three/commit/2d16772))
- **core:** make sure escape template tag for generation ([6a702d6](https://github.com/angular-threejs/angular-three/commit/6a702d6))
- **core:** use correct syntax for substitution generate files ([4194370](https://github.com/angular-threejs/angular-three/commit/4194370))
- **core:** adjust template for experience component to include angular-three imports ([1249f0f](https://github.com/angular-threejs/angular-three/commit/1249f0f))
- **core:** force standalone for experience generation ([2b4c9fa](https://github.com/angular-threejs/angular-three/commit/2b4c9fa))
- **core:** rename assertInjectionContext to assertInjector ([79c68aa](https://github.com/angular-threejs/angular-three/commit/79c68aa))
- **core:** update type for afterAttach ([3b01ce5](https://github.com/angular-threejs/angular-three/commit/3b01ce5))
- **core:** clean up ngt ref ([1125c86](https://github.com/angular-threejs/angular-three/commit/1125c86))
- **core:** fix core type for loader ([9c741ea](https://github.com/angular-threejs/angular-three/commit/9c741ea))
- **core:** adjust nested effects ([59f0dda](https://github.com/angular-threejs/angular-three/commit/59f0dda))
- **core:** update package target to build plugin last ([1bf5884](https://github.com/angular-threejs/angular-three/commit/1bf5884))
- **core:** adjust import for selection ([b118e47](https://github.com/angular-threejs/angular-three/commit/b118e47))
- **core:** change the way NgtSelect works ([50f0cea](https://github.com/angular-threejs/angular-three/commit/50f0cea))
- **core:** simplify NgtSelection API with exposing single method update ([9fce320](https://github.com/angular-threejs/angular-three/commit/9fce320))
- **core:** return early if there is namespace during createElement ([610d56f](https://github.com/angular-threejs/angular-three/commit/610d56f))
- **core:** comment out update matrix automatically ([2f813fa](https://github.com/angular-threejs/angular-three/commit/2f813fa))
- **core:** use noinfer for TData on loader's onLoad ([536aa05](https://github.com/angular-threejs/angular-three/commit/536aa05))
- **core:** account for when parent is null in removeChild ([08c27e5](https://github.com/angular-threejs/angular-three/commit/08c27e5))
- **core:** double check for falsy parent in removeChild ([5f1a36d](https://github.com/angular-threejs/angular-three/commit/5f1a36d))
- **core:** adjust removeChild logic to get THREE parent first before getting renderer parent ([d97d48d](https://github.com/angular-threejs/angular-three/commit/d97d48d))
- **core:** bail if parent is null in removeChild but do clean up if there's internal child ([2691fd0](https://github.com/angular-threejs/angular-three/commit/2691fd0))
- **core:** call signal for parent() in remove child ([ca711d7](https://github.com/angular-threejs/angular-three/commit/ca711d7))
- **core:** handle NgtAttachFunction for ngt-value as well ([b1d1006](https://github.com/angular-threejs/angular-three/commit/b1d1006))
- **core:** adjust onLoad parameter type ([fd37f28](https://github.com/angular-threejs/angular-three/commit/fd37f28))
- **core:** use optional chaining for localState parent since it can be null ([5eff54a](https://github.com/angular-threejs/angular-three/commit/5eff54a))
- **core:** assert any for $event ([7b54fae](https://github.com/angular-threejs/angular-three/commit/7b54fae))
- **core:** use onReady event from Canvas NS ([93dafef](https://github.com/angular-threejs/angular-three/commit/93dafef))
- **core:** set size for gl in native ([a560270](https://github.com/angular-threejs/angular-three/commit/a560270))
- **core:** optional chaining on renderer state as it can be null during nullifying state of previous object downstream ([f42a9fe](https://github.com/angular-threejs/angular-three/commit/f42a9fe))
- **core:** clean up NgtObjectEvents; do not use afterNextRender in injectObjectEvents ([1fcf43a](https://github.com/angular-threejs/angular-three/commit/1fcf43a))
- ⚠️  **core:** unwrap `afterNextRender` in `injectLoader` ([d57d1cc](https://github.com/angular-threejs/angular-three/commit/d57d1cc))
- **core:** adjust add soba generator to remove dup three mesh bvh peerdep ([c3b68e2](https://github.com/angular-threejs/angular-three/commit/c3b68e2))
- **core:** adjust loader to bail on only falsy url when multiple urls are passed in ([67a6d2c](https://github.com/angular-threejs/angular-three/commit/67a6d2c))
- **core:** update peer deps ([ef92608](https://github.com/angular-threejs/angular-three/commit/ef92608))
- **core:** ensure three native events (w/ EventDispatcher) work properly ([2a0edd6](https://github.com/angular-threejs/angular-three/commit/2a0edd6))
- **core:** assign intermediate ref to the parent store for non-three instance during applyProps ([6fb9294](https://github.com/angular-threejs/angular-three/commit/6fb9294))
- **core:** add output emitter ref utilities ([1457ce7](https://github.com/angular-threejs/angular-three/commit/1457ce7))
- **core:** make sure add method is available before calling ([92af0e9](https://github.com/angular-threejs/angular-three/commit/92af0e9))
- **core:** use effect directly for selection ([19cd21e](https://github.com/angular-threejs/angular-three/commit/19cd21e))
- **core:** clean up loader; remove allowSignalWrites in injectLoader ([3c074c5](https://github.com/angular-threejs/angular-three/commit/3c074c5))
- **core:** clean up args; ([86d31aa](https://github.com/angular-threejs/angular-three/commit/86d31aa))
- **core:** add geometryStamp to ngt instance ([2cf9113](https://github.com/angular-threejs/angular-three/commit/2cf9113))
- **core:** adjust object events; remove afterNextRender ([63d6e74](https://github.com/angular-threejs/angular-three/commit/63d6e74))
- **core:** remove autoEffect in canvas ([94834a6](https://github.com/angular-threejs/angular-three/commit/94834a6))
- **core:** clean up portal; remove autoEffect ([6ad06e1](https://github.com/angular-threejs/angular-three/commit/6ad06e1))
- **core:** add geometryStamp and updateGeometryStamp to types ([4c730bb](https://github.com/angular-threejs/angular-three/commit/4c730bb))
- **core:** check setClearAlpha before calling ([33ba160](https://github.com/angular-threejs/angular-three/commit/33ba160))
- **plugin:** change init logic for geenrating experience ([8a14c89](https://github.com/angular-threejs/angular-three/commit/8a14c89))
- **plugin:** miss a typo ([994eb99](https://github.com/angular-threejs/angular-three/commit/994eb99))
- **plugin:** trim the template when in append experience mode ([2fccad0](https://github.com/angular-threejs/angular-three/commit/2fccad0))
- **plugin:** fix peer dependencies prompt for add-soba ([07eca89](https://github.com/angular-threejs/angular-three/commit/07eca89))
- **plugin:** only add metadata json path to vscode settings if it's not there ([cafcf51](https://github.com/angular-threejs/angular-three/commit/cafcf51))
- **plugin:** try using esnext ([2600c9e](https://github.com/angular-threejs/angular-three/commit/2600c9e))
- **plugin:** adjust add-soba generator to make sure all peer deps are installed properly ([caf58a6](https://github.com/angular-threejs/angular-three/commit/caf58a6))
- **plugin:** add missing peer dep to collection ([3d6362c](https://github.com/angular-threejs/angular-three/commit/3d6362c))
- **plugin:** bump threejs version ([18b9a9e](https://github.com/angular-threejs/angular-three/commit/18b9a9e))
- **postprocessing:** update peer deps ([4d5ee21](https://github.com/angular-threejs/angular-three/commit/4d5ee21))
- **postprocessing:** remove afterNextRender and autoEffect ([4d0918d](https://github.com/angular-threejs/angular-three/commit/4d0918d))
- **rapier:** clean up framestepper; remove afterNextRender and autoEffect ([0e27857](https://github.com/angular-threejs/angular-three/commit/0e27857))
- **rapier:** auto colliders should still work if physicsColliders is false BUT colliders is set ([07ecec0](https://github.com/angular-threejs/angular-three/commit/07ecec0))
- **rapier:** clean up rapier ([9cda37b](https://github.com/angular-threejs/angular-three/commit/9cda37b))
- **repo:** align peer dependencies ranges to better control them ([bcebf76](https://github.com/angular-threejs/angular-three/commit/bcebf76))
- **soba:** extend InstancedBufferAttribute ([e39cdb2](https://github.com/angular-threejs/angular-three/commit/e39cdb2))
- **soba:** attempt to use args for instanced buffer attribute ([6862a07](https://github.com/angular-threejs/angular-three/commit/6862a07))
- **soba:** reverse occlusion logic in HTML ([17c5123](https://github.com/angular-threejs/angular-three/commit/17c5123))
- **soba:** use texture params for progressive light maps ([72fef8c](https://github.com/angular-threejs/angular-three/commit/72fef8c))
- **soba:** ensure default intensity for accumulative shadows is taking legacy lights into account ([89f060f](https://github.com/angular-threejs/angular-three/commit/89f060f))
- **soba:** add content projection for orbit controls ([8a6526c](https://github.com/angular-threejs/angular-three/commit/8a6526c))
- **soba:** clean up cube camera ([ce60420](https://github.com/angular-threejs/angular-three/commit/ce60420))
- **soba:** make fbo return a Signal instead of NgtInjectedRef ([6160a2e](https://github.com/angular-threejs/angular-three/commit/6160a2e))
- **soba:** clean up trail texture ([e8a94c2](https://github.com/angular-threejs/angular-three/commit/e8a94c2))
- **soba:** make ngtsTrail return a Signal instead of NgtInjectedRef ([5d30c3a](https://github.com/angular-threejs/angular-three/commit/5d30c3a))
- **soba:** match MeshTransmissionMaterial with Drei ([0d09a28](https://github.com/angular-threejs/angular-three/commit/0d09a28))
- **soba:** clean up animations ([90545c6](https://github.com/angular-threejs/angular-three/commit/90545c6))
- **soba:** clean up sampler ([d7426b7](https://github.com/angular-threejs/angular-three/commit/d7426b7))
- **soba:** use valid angular for caustics ([70f4f32](https://github.com/angular-threejs/angular-three/commit/70f4f32))
- **soba:** adjust type for all attach input to NgtAttachable ([02bbc13](https://github.com/angular-threejs/angular-three/commit/02bbc13))
- **soba:** rename directive selectors to camel case instead of kebab ([ce1d543](https://github.com/angular-threejs/angular-three/commit/ce1d543))
- **soba:** adjust contact shadows ([aa3d022](https://github.com/angular-threejs/angular-three/commit/aa3d022))
- **soba:** fix options type for helper ([f8f93a5](https://github.com/angular-threejs/angular-three/commit/f8f93a5))
- **soba:** adjust type for gltfloader onLoad and allows preLoad to pass in onLoad ([7d0ad62](https://github.com/angular-threejs/angular-three/commit/7d0ad62))
- **soba:** attempt to use commonjs with loadEsmModule ([78060c0](https://github.com/angular-threejs/angular-three/commit/78060c0))
- **soba:** another attempt to load injectGLTF ([02ccc26](https://github.com/angular-threejs/angular-three/commit/02ccc26))
- **soba:** test gltf generator ([8d4c75d](https://github.com/angular-threejs/angular-three/commit/8d4c75d))
- **soba:** remove gltf generator (gonna make a separate CLI instead) ([ab1603a](https://github.com/angular-threejs/angular-three/commit/ab1603a))
- **soba:** another attempt with gltf generator using node-three-gltf ([5095308](https://github.com/angular-threejs/angular-three/commit/5095308))
- **soba:** remove gltf generator again ([08dbc31](https://github.com/angular-threejs/angular-three/commit/08dbc31))
- ⚠️  **soba:** unwrap `afterNextRender` in `injectHelper` ([537be01](https://github.com/angular-threejs/angular-three/commit/537be01))
- ⚠️  **soba:** unwrap `afterNextRender` in `injectFBO`, `injectIntersect`, and `injectSurfaceSampler` ([0599c1a](https://github.com/angular-threejs/angular-three/commit/0599c1a))
- ⚠️  **soba:** unwrap `afterNextRender` in `injectEnvironment` and `injectNormalTexture` ([47dba57](https://github.com/angular-threejs/angular-three/commit/47dba57))
- **soba:** clean up `injectAnimations` ([c52b925](https://github.com/angular-threejs/angular-three/commit/c52b925))
- ⚠️  **soba:** unwrap `afterNextRender` in `injectAnimations` ([c325c92](https://github.com/angular-threejs/angular-three/commit/c325c92))
- **soba:** update peer deps ([92e0e05](https://github.com/angular-threejs/angular-three/commit/92e0e05))
- **soba:** adjust orbit controls event type ([877d006](https://github.com/angular-threejs/angular-three/commit/877d006))
- **soba:** add attach input to prism geometry ([dc83f8b](https://github.com/angular-threejs/angular-three/commit/dc83f8b))
- **soba:** bump pmndrs/vanilla version ([2599568](https://github.com/angular-threejs/angular-three/commit/2599568))
- **soba:** add preload and clear to injectEnvironment ([395d6bf](https://github.com/angular-threejs/angular-three/commit/395d6bf))
- **soba:** track parent nonObjects before creating decal ([0091a6f](https://github.com/angular-threejs/angular-three/commit/0091a6f))
- **soba:** clean up sampler; use computed instead of setting signals in effect ([f5262bc](https://github.com/angular-threejs/angular-three/commit/f5262bc))
- **soba:** also register nonObjects() for center (so geometries can be taken into account) ([71d4c2c](https://github.com/angular-threejs/angular-three/commit/71d4c2c))
- **soba:** clean up environment; use effect more effectively (no pun) ([a8e2966](https://github.com/angular-threejs/angular-three/commit/a8e2966))
- **soba:** clean up sampler even more ([88fbae4](https://github.com/angular-threejs/angular-three/commit/88fbae4))
- **soba:** clean up a lot of afterNextRender / autoEffect ([d41fc91](https://github.com/angular-threejs/angular-three/commit/d41fc91))
- **soba:** clean up sampler returning the computed directly ([f33136c](https://github.com/angular-threejs/angular-three/commit/f33136c))
- **soba:** fix type for viewcube ([749b97b](https://github.com/angular-threejs/angular-three/commit/749b97b))

### 💅 Refactors

- **cannon:** adjust injectBody ([be14df8](https://github.com/angular-threejs/angular-three/commit/be14df8))
- **core:** use VCR from canvas element instead of host ([f739b89](https://github.com/angular-threejs/angular-three/commit/f739b89))
- **core:** nullify the __ngt_dom_parent__ for HTML component ([57c0568](https://github.com/angular-threejs/angular-three/commit/57c0568))
- **core:** use DebugNode instead of getDebugNode ([7f39e5c](https://github.com/angular-threejs/angular-three/commit/7f39e5c))
- **core:** remove unnecessary untracked in noZoneRender ([af5e8c6](https://github.com/angular-threejs/angular-three/commit/af5e8c6))
- **core:** clean up canvas and portal ([709d259](https://github.com/angular-threejs/angular-three/commit/709d259))
- **core:** improve hexify performance with internal instance cache ([8290542](https://github.com/angular-threejs/angular-three/commit/8290542))
- **soba:** adjust shader material to not spread on uniforms ([bbd747f](https://github.com/angular-threejs/angular-three/commit/bbd747f))
- **soba:** extract THREE.REVISION to a constant ([c6a253c](https://github.com/angular-threejs/angular-three/commit/c6a253c))
- **soba:** simplify contact shadows; multiply frames to workaround race cond ([224ef16](https://github.com/angular-threejs/angular-three/commit/224ef16))
- **soba:** simplify render texture template ([7a9c2be](https://github.com/angular-threejs/angular-three/commit/7a9c2be))
- **soba:** use raycast=null instead of nullRaycast ([c92c021](https://github.com/angular-threejs/angular-three/commit/c92c021))

### ⚠️  Breaking Changes

- **rapier:** in order to support fallback content, physics content
- **cannon:** This is considered a breaking change because of change
- **core:** this is considered a breaking change because of timing
- **soba:** this is considered a breaking change because of timing
- **soba:** this is considered a breaking change because of timing
- **soba:** this is considered a breaking change because of timing
- ⚠️  **soba:** unwrap `afterNextRender` in `injectAnimations` ([c325c92](https://github.com/angular-threejs/angular-three/commit/c325c92))

### ❤️  Thank You

- Chau Tran
- nartc



## [2.0.0-beta.41](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.40...2.0.0-beta.41) (2023-10-04)


### Features

* **rapier:** add rapier ([ff76de7](https://github.com/angular-threejs/angular-three/commit/ff76de72eb57a9b299aceeaa760e00d677f101fd))

## [2.0.0-beta.40](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.39...2.0.0-beta.40) (2023-09-27)


### Bug Fixes

* **core:** fix core type for loader ([9c741ea](https://github.com/angular-threejs/angular-three/commit/9c741eaaad6b95847cd15ca580592d1693c7d5d3))

## [2.0.0-beta.39](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.38...2.0.0-beta.39) (2023-09-26)


### Features

* **core:** update ngxtension ([f3bbd0c](https://github.com/angular-threejs/angular-three/commit/f3bbd0cf7aa37620a309e0222444171c3d48c1c1))
* **core:** update nx ([3e55988](https://github.com/angular-threejs/angular-three/commit/3e559884557e68d1cff7c87ce38618541bb86526))

## [2.0.0-beta.38](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.37...2.0.0-beta.38) (2023-09-22)


### Bug Fixes

* **core:** clean up ngt ref ([1125c86](https://github.com/angular-threejs/angular-three/commit/1125c86798d203edbdfbb876bc21396bef0828b7))
* **soba:** clean up animations ([90545c6](https://github.com/angular-threejs/angular-three/commit/90545c6b361b0c52e1783d71b272fba4f506ebcf))
* **soba:** clean up cube camera ([ce60420](https://github.com/angular-threejs/angular-three/commit/ce60420e21bf37efc11d766e3be76ede52eaff6c))
* **soba:** clean up sampler ([d7426b7](https://github.com/angular-threejs/angular-three/commit/d7426b7a57f5cf1c2ade86717b6fa528a0454ef9))
* **soba:** clean up trail texture ([e8a94c2](https://github.com/angular-threejs/angular-three/commit/e8a94c290132b67607fcc865908dc384b4c480b3))
* **soba:** make fbo return a Signal instead of NgtInjectedRef ([6160a2e](https://github.com/angular-threejs/angular-three/commit/6160a2e708dc8edfb4e49126d3d59ac705f4c404))
* **soba:** make ngtsTrail return a Signal instead of NgtInjectedRef ([5d30c3a](https://github.com/angular-threejs/angular-three/commit/5d30c3aa82219bf0ed5aa267f318187dbd82eb1f))
* **soba:** match MeshTransmissionMaterial with Drei ([0d09a28](https://github.com/angular-threejs/angular-three/commit/0d09a288abfc21adcc0bd7c104c73be771eb3ddd))
* **soba:** use valid angular for caustics ([70f4f32](https://github.com/angular-threejs/angular-three/commit/70f4f32e117da99e424d5e1d1a1b11fcd189205e))


### Documentations

* **soba:** update storybook ([089da91](https://github.com/angular-threejs/angular-three/commit/089da9136bced8f8c2272cfda597ae8c349d2216))

## [2.0.0-beta.37](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.36...2.0.0-beta.37) (2023-09-19)


### Bug Fixes

* only get state if it's available ([33aa00f](https://github.com/angular-threejs/angular-three/commit/33aa00f6206ec0344875819b0a1292be9c34ff3f))

## [2.0.0-beta.36](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.35...2.0.0-beta.36) (2023-09-18)

## [2.0.0-beta.35](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.34...2.0.0-beta.35) (2023-09-18)


### Bug Fixes

* adjust version of ngxtension ([7c5b54a](https://github.com/angular-threejs/angular-three/commit/7c5b54a950df526cfab0262b9168184355fa9c99))

## [2.0.0-beta.34](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.33...2.0.0-beta.34) (2023-09-18)


### Bug Fixes

* make sure to install ngxtension ([6ee16a7](https://github.com/angular-threejs/angular-three/commit/6ee16a71c481b6ded84c10fa81a1d53dc8292e80))

## [2.0.0-beta.33](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.32...2.0.0-beta.33) (2023-09-18)


### Bug Fixes

* migration migrates all the times ([83ca9c6](https://github.com/angular-threejs/angular-three/commit/83ca9c62e10f6b3661f390208ce2675b3a4c65e3))

## [2.0.0-beta.32](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.31...2.0.0-beta.32) (2023-09-18)

## [2.0.0-beta.31](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.30...2.0.0-beta.31) (2023-09-18)


### Features

* add select to storeApi ([9d5da39](https://github.com/angular-threejs/angular-three/commit/9d5da39111fc4dfeb55305a6df0bb3acb194bd43))
* adjust migration ([04d2924](https://github.com/angular-threejs/angular-three/commit/04d2924d5f4c2647e2001c3e53c0cef36b175913))

## [2.0.0-beta.30](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.29...2.0.0-beta.30) (2023-09-15)


### Features

* use ngxtension ([f785e1d](https://github.com/angular-threejs/angular-three/commit/f785e1d1f05775070ee2975ef0e924d7188d0934))

## [2.0.0-beta.29](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.28...2.0.0-beta.29) (2023-09-09)


### Features

* **core:** bump three 0.156 ([3f847ef](https://github.com/angular-threejs/angular-three/commit/3f847efe476679252b0817b60298475ecabd3c82))


### Documentations

* **soba:** adjust lightings on some stories ([fb7f24b](https://github.com/angular-threejs/angular-three/commit/fb7f24ba17cf744ce10ad942e071939a6b8f27a7))
* **soba:** remove useLegacyLights from accumulative shadows story ([909f661](https://github.com/angular-threejs/angular-three/commit/909f661c10a3ea9a768d44352fb8e962d05c62ba))

## [2.0.0-beta.28](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.27...2.0.0-beta.28) (2023-09-08)


### Bug Fixes

* **core:** update type for afterAttach ([3b01ce5](https://github.com/angular-threejs/angular-three/commit/3b01ce5094d869b0a9b77a4b51e30e4fa99e889d))
* **soba:** add content projection for orbit controls ([8a6526c](https://github.com/angular-threejs/angular-three/commit/8a6526c557d0028754a9c3c35173c249d7e4ddfa))


### Documentations

* **soba:** add mesh transmission material story ([b138255](https://github.com/angular-threejs/angular-three/commit/b13825593eb85d31c8206f6e0db7f7bff443e5d5))

## [2.0.0-beta.27](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.26...2.0.0-beta.27) (2023-09-06)


### Features

* **core:** update nx ([27ca571](https://github.com/angular-threejs/angular-three/commit/27ca571909095f65dc63c03b7a052e08b9bb05a2))
* **soba:** allow set global decoder path ([cbe0cc4](https://github.com/angular-threejs/angular-three/commit/cbe0cc4d438c9d0ad15e7755abbbe2c49f887426))


### Bug Fixes

* **core:** rename assertInjectionContext to assertInjector ([79c68aa](https://github.com/angular-threejs/angular-three/commit/79c68aae3b96904e2ca88c37f0437caff699d7d3))
* **soba:** ensure default intensity for accumulative shadows is taking legacy lights into account ([89f060f](https://github.com/angular-threejs/angular-three/commit/89f060f22c4720c8aea9db53b7a707c69fdb1e07))
* **soba:** use texture params for progressive light maps ([72fef8c](https://github.com/angular-threejs/angular-three/commit/72fef8cf387f567fd943f02d8f9eda0e04a4d8c5))

## [2.0.0-beta.26](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.25...2.0.0-beta.26) (2023-08-30)


### Bug Fixes

* **core:** force standalone for experience generation ([2b4c9fa](https://github.com/angular-threejs/angular-three/commit/2b4c9fae9365b473168023605a6f19ceed52332f))

## [2.0.0-beta.25](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.24...2.0.0-beta.25) (2023-08-29)


### Bug Fixes

* **core:** adjust template for experience component to include angular-three imports ([1249f0f](https://github.com/angular-threejs/angular-three/commit/1249f0f0e440c0ba263b66f0441bba25fcbe9fd7))

## [2.0.0-beta.24](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.23...2.0.0-beta.24) (2023-08-29)


### Bug Fixes

* **core:** use correct syntax for substitution generate files ([4194370](https://github.com/angular-threejs/angular-three/commit/4194370ab6b3d52297c1ab435bf339d2f64f0df3))

## [2.0.0-beta.23](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.22...2.0.0-beta.23) (2023-08-29)


### Bug Fixes

* **core:** make sure escape template tag for generation ([6a702d6](https://github.com/angular-threejs/angular-three/commit/6a702d6bb57226b14584170c43521363fecd8df3))

## [2.0.0-beta.22](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.21...2.0.0-beta.22) (2023-08-29)


### Bug Fixes

* **core:** adjust tsqueyr usage for generator ([2d16772](https://github.com/angular-threejs/angular-three/commit/2d16772f96916525e3a5b4abddf8a490e14d544a))

## [2.0.0-beta.21](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.20...2.0.0-beta.21) (2023-08-29)


### Bug Fixes

* **core:** adjust generator sourceRoot ([701b7c9](https://github.com/angular-threejs/angular-three/commit/701b7c9988e4e0a7acd053e91410a5817edbb395))

## [2.0.0-beta.20](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.19...2.0.0-beta.20) (2023-08-29)


### Bug Fixes

* **core:** adjust experience generator ([fad08f6](https://github.com/angular-threejs/angular-three/commit/fad08f6ce20b43bdd9d08eef31642fbc62dd80eb))

## [2.0.0-beta.19](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.18...2.0.0-beta.19) (2023-08-29)


### Features

* **core:** add experience generation (beta) ([650eb26](https://github.com/angular-threejs/angular-three/commit/650eb262da15c06f83cbeb6ce46275265cc284cc))

## [2.0.0-beta.18](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.17...2.0.0-beta.18) (2023-08-28)

### Features

-   **soba:** gizmo ([8ac565c](https://github.com/angular-threejs/angular-three/commit/8ac565c50c8f8d8e3639d09f5a51f76393e5c163))

### Bug Fixes

-   **soba:** reverse occlusion logic in HTML ([17c5123](https://github.com/angular-threejs/angular-three/commit/17c5123a0cd6e9362ccb91c7c8646b1f3e481e58))

### Documentations

-   more on aviator ([aea07c6](https://github.com/angular-threejs/angular-three/commit/aea07c6b1007887169ae4b645baac57b2a721ea9))

## [2.0.0-beta.17](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.16...2.0.0-beta.17) (2023-08-23)

### Bug Fixes

-   **core:** adjust createAttachFn positional type arguments ([b65fe57](https://github.com/angular-threejs/angular-three/commit/b65fe57bc8ab21089ebce86835c0508908f8a755))

### Documentations

-   adjust sandbox app component ([15b0a27](https://github.com/angular-threejs/angular-three/commit/15b0a279588dfe125e390093427b48ea09eaea17))

## [2.0.0-beta.16](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.15...2.0.0-beta.16) (2023-08-16)

### Features

-   **plugin:** update init-soba generator to add metadata.json ([6009ca0](https://github.com/angular-threejs/angular-three/commit/6009ca0ac57a1286e8010b902773c84786c6bb48))

## [2.0.0-beta.15](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.14...2.0.0-beta.15) (2023-08-16)

### Documentations

-   add skydiving example ([88e5121](https://github.com/angular-threejs/angular-three/commit/88e51217e8447b4aefc011c99e24f118fb6aa706))

## [2.0.0-beta.14](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.13...2.0.0-beta.14) (2023-08-15)

### Bug Fixes

-   **soba:** attempt to use args for instanced buffer attribute ([6862a07](https://github.com/angular-threejs/angular-three/commit/6862a07775555e9b262f921538bbaf3fb20c2599))

## [2.0.0-beta.13](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.12...2.0.0-beta.13) (2023-08-15)

### Bug Fixes

-   **soba:** extend InstancedBufferAttribute ([e39cdb2](https://github.com/angular-threejs/angular-three/commit/e39cdb2dda6827cd89cabda2a49cb5ea644a81ce))

## [2.0.0-beta.12](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.11...2.0.0-beta.12) (2023-08-15)

### Features

-   **soba:** add instances ([e118791](https://github.com/angular-threejs/angular-three/commit/e118791d75aab7cfb88f7575f45efd08db789ee3))

## [2.0.0-beta.11](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.10...2.0.0-beta.11) (2023-08-15)

### Features

-   **core:** upgrade nx ([c3bbc46](https://github.com/angular-threejs/angular-three/commit/c3bbc465b065e0c2735321012ed4f092ae7844b6))

### Bug Fixes

-   **core:** only proceed with append logic for DOMs if render state is available ([5a56e6d](https://github.com/angular-threejs/angular-three/commit/5a56e6d92e18bf83076c220a36e61e04f08df48a))

## [2.0.0-beta.10](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.9...2.0.0-beta.10) (2023-08-15)

### Bug Fixes

-   **core:** make sure renderer work correctly for two DOMs elements that might contain THREE children ([b1987ba](https://github.com/angular-threejs/angular-three/commit/b1987ba9ea58f204e7618767773d1c2980f06b04))

## [2.0.0-beta.9](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.8...2.0.0-beta.9) (2023-08-15)

## 2.0.0-beta.8 (2023-08-14)

### Features

-   **core:** generate core ([e1cf6c7](https://github.com/angular-threejs/angular-three/commit/e1cf6c7422668afbbc0f767a444bcc591e1a6903))