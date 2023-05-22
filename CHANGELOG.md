

## [2.0.0-beta.4](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.3...2.0.0-beta.4) (2023-05-22)


### Features

* **core:** expose "state" as signal readonly ([774fc7b](https://github.com/angular-threejs/angular-three/commit/774fc7b46f5a4599bec9f8ee5090b943d744ce4f))
* **soba:** add Grid ([204bb49](https://github.com/angular-threejs/angular-three/commit/204bb492f7a3f5a677ecfc09a4ea53a64fbffb35))


### Bug Fixes

* **core:** call safeDetectChanges in CommonDirective instead of calling detectChanges() ([d88ca49](https://github.com/angular-threejs/angular-three/commit/d88ca4984eadbd401863ad5030d98fd89fa3ba54))
* **core:** trigger cdr in an animation frame after setting nativeElement on ref ([f65807c](https://github.com/angular-threejs/angular-three/commit/f65807ce9418178355615b0b10b3b64f348259bb))
* **soba:** adjust ngtsAnimations ([3cb63a5](https://github.com/angular-threejs/angular-three/commit/3cb63a549d6114ec27238fb37175306d0e87f1f7))
* **soba:** catch up with latest fix with mesh refraction material from r3f ([51b5062](https://github.com/angular-threejs/angular-three/commit/51b506214fcaf187c706694d64e61239806875d7))
* **soba:** fix args type in grid ([995b568](https://github.com/angular-threejs/angular-three/commit/995b568c39a50e96f3a81d88c6d8711719d12548))
* **soba:** init plugin with all dependencies ([5942477](https://github.com/angular-threejs/angular-three/commit/594247776cebfb01644255af8f5ccbe0d8e19ada))


### Documentations

* add release blog post ([0566683](https://github.com/angular-threejs/angular-three/commit/0566683757218e33bed525254ff60f8ee96ac2be))
* start on migration docs ([baffa23](https://github.com/angular-threejs/angular-three/commit/baffa23fe3ec9a6188b6719ac01160c3d72a7b1c))
* update documentation ([ce80683](https://github.com/angular-threejs/angular-three/commit/ce806837219a9478a755cca5aeaa737a5c856369))

## [2.0.0-beta.3](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.2...2.0.0-beta.3) (2023-05-19)

## [2.0.0-beta.2](https://github.com/angular-threejs/angular-three/compare/2.0.0-beta.1...2.0.0-beta.2) (2023-05-19)


### Features

* **cannon:** add physics ([b018754](https://github.com/angular-threejs/angular-three/commit/b018754d06ed3dc5a2e98fdd0cbed8397828d95b))
* **cannon:** migrate body ([fb7e349](https://github.com/angular-threejs/angular-three/commit/fb7e349c4c230de1d03146d41d84ee25c433e5de))
* **cannon:** migrate constraint ([dcc5ad5](https://github.com/angular-threejs/angular-three/commit/dcc5ad5978bf4cf23a7fe53f7e781a6b7fd683d3))
* **cannon:** migrate contact material ([5b1f717](https://github.com/angular-threejs/angular-three/commit/5b1f717d7e616465c47bf946fcbd060cf5dd253e))
* **cannon:** migrate debug ([eba9277](https://github.com/angular-threejs/angular-three/commit/eba9277577f64386b19eadc48c91c999996752e4))
* **cannon:** migrate ray ([9805f50](https://github.com/angular-threejs/angular-three/commit/9805f50720bb8a9642632ea155d556db3c748b63))
* **cannon:** migrate raycast vehicle ([5c425de](https://github.com/angular-threejs/angular-three/commit/5c425ded8ceb3e78a7b052a8c03a572cca4978c7))
* **cannon:** migrate spring ([a4f0e43](https://github.com/angular-threejs/angular-three/commit/a4f0e4323b3efe34ef888068cfd0efd4b214cadb))
* **cannon:** prep cannon ([87e3bdb](https://github.com/angular-threejs/angular-three/commit/87e3bdb3a30de7687df3df023a9b80bfaeeeca7d))
* **core:** add nativeProps signal to track native properties on THREE instance ([f56549c](https://github.com/angular-threejs/angular-three/commit/f56549c29729d965fec267ef2509c0ea66f81b96))
* **core:** add timing in injection context functions ([f775b53](https://github.com/angular-threejs/angular-three/commit/f775b53e884c6634bfd2b897c2c62e8a1b3e25e6))
* **postprocessing:** initial work ([f0818e8](https://github.com/angular-threejs/angular-three/commit/f0818e860f35ffefa398d838e2d4961c56355308))
* **postprocessing:** migrate all simple effects ([7cc706b](https://github.com/angular-threejs/angular-three/commit/7cc706b028efef83d6e6e5568053210f9279f3f0))
* **postprocessing:** migrate LUT ([0597d0c](https://github.com/angular-threejs/angular-three/commit/0597d0cb30ac9a2cae4745bcd00db12cf2c68004))
* **postprocessing:** migrate plugin ([572d7bb](https://github.com/angular-threejs/angular-three/commit/572d7bba0cbb18219b94d44892df8952341df111))
* **postprocessing:** migrate SSAO ([a87b9a8](https://github.com/angular-threejs/angular-three/commit/a87b9a8a68f48450ebbd61a572ed34e338de05ba))
* **soba:** add instances ([ea65873](https://github.com/angular-threejs/angular-three/commit/ea65873fb1c0dbc5e174f0f995fd09971f87813f))
* **soba:** add mesh distort and mesh wobble material ([aee4943](https://github.com/angular-threejs/angular-three/commit/aee494334c664e50ba576155d5552e4263b20aa1))
* **soba:** migrate accumulative shadows ([b0080e0](https://github.com/angular-threejs/angular-three/commit/b0080e0f10e70606a5b8b5eb7594059af87602f1))
* **soba:** migrate bounds ([1c69a34](https://github.com/angular-threejs/angular-three/commit/1c69a34250344eaf79687b6f3a99be772697de7f))
* **soba:** migrate camera shake ([5285174](https://github.com/angular-threejs/angular-three/commit/5285174e5dfb3e7f0389cb4b51d2f3c0b95b8925))
* **soba:** migrate cameras ([25d69b6](https://github.com/angular-threejs/angular-three/commit/25d69b660b9a613d533553d79c245b2f2438da8d))
* **soba:** migrate catmull rom line ([6bc743c](https://github.com/angular-threejs/angular-three/commit/6bc743cc474823c4b5fa5006f1f00c3599be38aa))
* **soba:** migrate caustics ([e86ebc8](https://github.com/angular-threejs/angular-three/commit/e86ebc8f2f3d68d7c7f3c99c9127dbcd3b565258))
* **soba:** migrate center ([f38281f](https://github.com/angular-threejs/angular-three/commit/f38281f5b25a4587d2f121390a3314287bcbade7))
* **soba:** migrate cloud ([e943869](https://github.com/angular-threejs/angular-three/commit/e9438691feba29e435cf2087c493d9fbb3cfe0e2))
* **soba:** migrate contact shadows ([92a5d50](https://github.com/angular-threejs/angular-three/commit/92a5d501cf94e07de7a23d75ce100bd5c05601a9))
* **soba:** migrate cubic bezier line ([d4e5840](https://github.com/angular-threejs/angular-three/commit/d4e58407b5d94ea9ca42c10a0be5ae43cd959843))
* **soba:** migrate float ([8657f53](https://github.com/angular-threejs/angular-three/commit/8657f5390300e17f762072d0fbaf4fb9e011f6a4))
* **soba:** migrate gizmo ([d9f4db1](https://github.com/angular-threejs/angular-three/commit/d9f4db186f0f752b6aae2bf844d4b6ad6d8d595a))
* **soba:** migrate Line ([f5efc4e](https://github.com/angular-threejs/angular-three/commit/f5efc4ebea2dc3c2635eb47551fb740a0512f2a2))
* **soba:** migrate misc ([0d3245d](https://github.com/angular-threejs/angular-three/commit/0d3245dd8a50a24783045d63e0fe4c012dae214a))
* **soba:** migrate performance ([9b16937](https://github.com/angular-threejs/angular-three/commit/9b16937f4fd7d805f2140cc9f2519398c0dabf5d))
* **soba:** migrate quadratic bezier line ([b68eaa0](https://github.com/angular-threejs/angular-three/commit/b68eaa02559933afc3ceb16b28eab03c6f1b35d2))
* **soba:** migrate reflection ([199a722](https://github.com/angular-threejs/angular-three/commit/199a722b8cd6c8bbbecefb09eafaa8e7b112c707))
* **soba:** migrate refraction and transmission material ([885f10e](https://github.com/angular-threejs/angular-three/commit/885f10ec15fd672eb667044254d0c072e79158b0))
* **soba:** migrate sky and refactor stories ([307cd41](https://github.com/angular-threejs/angular-three/commit/307cd41a6fd94aacfe36f7c872e5b54e77f398f4))
* **soba:** migrate sparkles ([64db4c2](https://github.com/angular-threejs/angular-three/commit/64db4c2e8708fedbb8b9c9f92bc463f5a34d20cd))
* **soba:** migrate spotlight ([cd67a8b](https://github.com/angular-threejs/angular-three/commit/cd67a8b92bba84f8fd5860af3b7cf612f30252f4))
* **soba:** migrate stage ([d418747](https://github.com/angular-threejs/angular-three/commit/d4187471bab46276a552bb0dde7c1c6587975630))
* **soba:** migrate stars ([b9e1cfb](https://github.com/angular-threejs/angular-three/commit/b9e1cfbde093f30e60f65cc124ca24055abf73c2))
* **soba:** migrate text ([8784ae1](https://github.com/angular-threejs/angular-three/commit/8784ae1cc7f575ed310b01745982a34118436f9f))
* **soba:** migrate text-3d ([98e3789](https://github.com/angular-threejs/angular-three/commit/98e3789158b6e9d3cdb4a3572f08f8c0cfa9fd9b))
* **soba:** setup soba ([10a1fa1](https://github.com/angular-threejs/angular-three/commit/10a1fa10eeb05a6977f9d48f0e79ab662c4cf18a))
* **soba:** setup soba plugin ([06fa3ce](https://github.com/angular-threejs/angular-three/commit/06fa3ce4c55fe718787bde8f1b5e87ef4f9f6946))
* **soba:** start migrating billboard and its story ([3cb1ed0](https://github.com/angular-threejs/angular-three/commit/3cb1ed0994090053e9b8ab8a3acd73e50246c762))
* **suspense:** init ([d817e4e](https://github.com/angular-threejs/angular-three/commit/d817e4ecaa78689c2f0a67369de38b926337158c))


### Bug Fixes

* **core:** adjust all selects ([adac197](https://github.com/angular-threejs/angular-three/commit/adac1976836d27104ba1e54791e64d699cc1ca4e))
* **core:** adjust assertInInjectionContext calls ([c7109ca](https://github.com/angular-threejs/angular-three/commit/c7109ca3754f5b383c6e816ef36b5fadcc43fc38))
* **core:** adjust safe detect changes ([a9214c5](https://github.com/angular-threejs/angular-three/commit/a9214c50389ececfc9983c515ff6c26b1f9e11ec))
* **core:** adjust timing on effects that read computed inputs ([4840344](https://github.com/angular-threejs/angular-three/commit/4840344640ae5a271be8e7d25164ab8567ad338f))
* **core:** clean up cdr call ([3e92fa3](https://github.com/angular-threejs/angular-three/commit/3e92fa3fb2eefc75f3de103d2270ef5a9c8b06a6))
* **core:** clean up injectNgtLoader ([9b66b44](https://github.com/angular-threejs/angular-three/commit/9b66b44b451a4cb3d1662584a03b87b8d521ab0a))
* **soba:** adjust environment to use ngtsEnvironmentInput as a provider ([3f178f0](https://github.com/angular-threejs/angular-three/commit/3f178f0c0144e2fb20a74bc09acdbef1c9e7f8c1))
* **soba:** adjust typings ([681c8d9](https://github.com/angular-threejs/angular-three/commit/681c8d9ac1f7a8c6c093bed21a66ad3452961ed2))
* **soba:** allow ref input for text 3d ([ae10eac](https://github.com/angular-threejs/angular-three/commit/ae10eac4cfc7deda465483ff5b336925f8c43306))
* **soba:** move effects into constructor ([075a1a2](https://github.com/angular-threejs/angular-three/commit/075a1a2ce93c8e1c9ac10b553c4f351e1e45d904))
* **soba:** relax typings (need revisit) ([0ee2984](https://github.com/angular-threejs/angular-three/commit/0ee2984343220c5c8445b75ec15f21d85265e156))
* **soba:** update spotLight shadow ([97fe376](https://github.com/angular-threejs/angular-three/commit/97fe3760e746ef0465f5849dd5d16faa39ea9191))
* update three types for primitive ([f9a3914](https://github.com/angular-threejs/angular-three/commit/f9a3914af4d7ab02a30565753e91d483977b6087))

## [2.0.0-beta.1](https://github.com/angular-threejs/angular-three/compare/1.10.3...2.0.0-beta.1) (2023-05-09)


### Features

* generate new lib ([580393b](https://github.com/angular-threejs/angular-three/commit/580393b26c07fe29f3464cc91b1fc85d8124177d))
* signals are ready ([ec8f498](https://github.com/angular-threejs/angular-three/commit/ec8f4981cb345851a08f4289b0dca0fea9b367da))


### Documentations

* update readme ([4b27e00](https://github.com/angular-threejs/angular-three/commit/4b27e003a942ee9a3f13677d53b15d6ed1ad09a6))

## [2.0.0-beta.0](https://github.com/angular-threejs/angular-three/compare/1.10.3...2.0.0-beta.0) (2023-05-09)


### Features

* generate new lib ([580393b](https://github.com/angular-threejs/angular-three/commit/580393b26c07fe29f3464cc91b1fc85d8124177d))
* signals are ready ([ec8f498](https://github.com/angular-threejs/angular-three/commit/ec8f4981cb345851a08f4289b0dca0fea9b367da))


### Documentations

* update readme ([4b27e00](https://github.com/angular-threejs/angular-three/commit/4b27e003a942ee9a3f13677d53b15d6ed1ad09a6))

### [1.10.3](https://github.com/angular-threejs/angular-three/compare/1.10.2...1.10.3) (2023-05-06)


### Bug Fixes

* export three-types ([0497ce6](https://github.com/angular-threejs/angular-three/commit/0497ce6e3ab9c16a8fb6a854e649fb60b52d2c7d))

### [1.10.2](https://github.com/angular-threejs/angular-three/compare/1.10.1...1.10.2) (2023-05-06)


### Bug Fixes

* adjust ng add generator ([dcbda79](https://github.com/angular-threejs/angular-three/commit/dcbda794c108add725398b2434fd633bab537cc2))

### [1.10.1](https://github.com/angular-threejs/angular-three/compare/1.10.0...1.10.1) (2023-05-06)


### Bug Fixes

* add nx to peer deps for now ([00ab36a](https://github.com/angular-threejs/angular-three/commit/00ab36a1f663e5d2062da8f9f946b88fb39b1f0e))

## [1.10.0](https://github.com/angular-threejs/angular-three/compare/1.9.16...1.10.0) (2023-05-06)


### Features

* add custom elements type ([8cb1e2a](https://github.com/angular-threejs/angular-three/commit/8cb1e2a986a981db9138cb1b10e0e8e6071432a2))
* adjust peer deps ([8ffedb3](https://github.com/angular-threejs/angular-three/commit/8ffedb34aeeb96e6326358718a0bb5e357558da5))
* update ng-add generator ([2e622c1](https://github.com/angular-threejs/angular-three/commit/2e622c136fbf47c6e447a62b5f9a039d087b2122))
* update setting color space and encoding with r152 ([3f77a7d](https://github.com/angular-threejs/angular-three/commit/3f77a7d6d0020cd6fb5a5aa259d3e1bd21dbfc65))

### [1.9.16](https://github.com/angular-threejs/angular-three/compare/1.9.15...1.9.16) (2023-04-11)

### [1.9.15](https://github.com/angular-threejs/angular-three/compare/1.9.14...1.9.15) (2023-04-11)


### Bug Fixes

* clean up renderer ([de101e9](https://github.com/angular-threejs/angular-three/commit/de101e9e5556d4332385564ba4eb1ec471fd449d))

### [1.9.14](https://github.com/angular-threejs/angular-three/compare/1.9.13...1.9.14) (2023-04-01)


### Bug Fixes

* afterAttach and afterUpdate events are not reassigned back on node local state ([22197d3](https://github.com/angular-threejs/angular-three/commit/22197d35d7980900d245ef896ffc24cd73f29c8e))

### [1.9.13](https://github.com/angular-threejs/angular-three/compare/1.9.12...1.9.13) (2023-03-31)

### [1.9.12](https://github.com/angular-threejs/angular-three/compare/1.9.11...1.9.12) (2023-03-06)


### Bug Fixes

* clean up change detection runs ([4ebddbb](https://github.com/angular-threejs/angular-three/commit/4ebddbb0f722509fcccff15d352a2c69c725c8e9))

### [1.9.11](https://github.com/angular-threejs/angular-three/compare/1.9.10...1.9.11) (2023-02-28)


### Bug Fixes

* adjust ColorManagement automatic configuration to accomodate 150 ([c00d4a1](https://github.com/angular-threejs/angular-three/commit/c00d4a167d9dab72aeef20850e9d987ecc1e59e1))


### Documentations

* add migrations ([97ae506](https://github.com/angular-threejs/angular-three/commit/97ae50621abce1ef920693a2f17f42e1bdc3b905))

### [1.9.10](https://github.com/angular-threejs/angular-three/compare/1.9.9...1.9.10) (2023-02-21)


### Bug Fixes

* use bitwise to check for inject flags ([0784dd0](https://github.com/angular-threejs/angular-three/commit/0784dd049a916cb6b92377f4feeaae125cae25ec))

### [1.9.9](https://github.com/angular-threejs/angular-three/compare/1.9.8...1.9.9) (2023-02-21)


### Bug Fixes

* use bitwise to manipulate flags ([12e1a6a](https://github.com/angular-threejs/angular-three/commit/12e1a6adc620bc8b276df7265042f6189823a116))

### [1.9.8](https://github.com/angular-threejs/angular-three/compare/1.9.7...1.9.8) (2023-02-21)


### Bug Fixes

* run environment injector with optional flags ([d2498fd](https://github.com/angular-threejs/angular-three/commit/d2498fd97fd48cd49366c0e28f5c6af6ee7ae996))

### [1.9.7](https://github.com/angular-threejs/angular-three/compare/1.9.6...1.9.7) (2023-02-21)


### Bug Fixes

* attempt 2 to prevent internal infinity loop regarding injectors ([dc482f3](https://github.com/angular-threejs/angular-three/commit/dc482f36dae0344aefba31b11bbc50897aa389f3))

### [1.9.6](https://github.com/angular-threejs/angular-three/compare/1.9.5...1.9.6) (2023-02-21)


### Bug Fixes

* match with latest react three fiber on applyProps ([b36d3ab](https://github.com/angular-threejs/angular-three/commit/b36d3abffa337122e0994108b53adcb456efe645))
* prevent internal inifinity loop with runInContext ([d3f95f5](https://github.com/angular-threejs/angular-three/commit/d3f95f527d27907d811bb5ee4e5fc6043ee44636))

### [1.9.5](https://github.com/angular-threejs/angular-three/compare/1.9.4...1.9.5) (2023-02-21)


### Bug Fixes

* clean up renderer ([ea7837e](https://github.com/angular-threejs/angular-three/commit/ea7837ea11765966e585c023f1ceb38ed02ae10b))

### [1.9.4](https://github.com/angular-threejs/angular-three/compare/1.9.3...1.9.4) (2023-02-20)


### Bug Fixes

* adjust overriden get logic ([3d074b5](https://github.com/angular-threejs/angular-three/commit/3d074b5bd80deda07894ed0e42a7dc2bb9603c40))

### [1.9.3](https://github.com/angular-threejs/angular-three/compare/1.9.2...1.9.3) (2023-02-20)


### Bug Fixes

* override NgtRxStore#get to prevent undefined ([ea4ea22](https://github.com/angular-threejs/angular-three/commit/ea4ea22e68fa795b624d04a01fd37ee73a9cf4d0))

### [1.9.2](https://github.com/angular-threejs/angular-three/compare/1.9.1...1.9.2) (2023-02-18)


### Bug Fixes

* return early at the right place ([0ff2d5e](https://github.com/angular-threejs/angular-three/commit/0ff2d5e2cbc7f5ea629c5117056a5e1b8c5b4b86))

### [1.9.1](https://github.com/angular-threejs/angular-three/compare/1.9.0...1.9.1) (2023-02-18)


### Bug Fixes

* infinity loop when parent and injectedParent are the same ([5e02f8a](https://github.com/angular-threejs/angular-three/commit/5e02f8ae1854b61d912027a9650cb40d57c2fe84))

## [1.9.0](https://github.com/angular-threejs/angular-three/compare/1.8.1...1.9.0) (2023-02-17)


### Features

* add parent directive to add "parent" slot to a 3d object ([346aa3d](https://github.com/angular-threejs/angular-three/commit/346aa3d5e6ac3f7edbc8f48f09ca38a912b98a70))

### [1.8.1](https://github.com/angular-threejs/angular-three/compare/1.8.0...1.8.1) (2023-02-17)


### Bug Fixes

* ensure cd is ran on route change if routed scene is used ([1702a51](https://github.com/angular-threejs/angular-three/commit/1702a510a53e40f7e50c4814e9e341787432528c))

## [1.8.0](https://github.com/angular-threejs/angular-three/compare/1.7.2...1.8.0) (2023-02-17)


### Features

* add routing capability ([0186d03](https://github.com/angular-threejs/angular-three/commit/0186d034939bed0f45f4ab53b17a4b71309d8e45))

### [1.7.2](https://github.com/angular-threejs/angular-three/compare/1.7.1...1.7.2) (2023-02-15)


### Bug Fixes

* destroy canvas properly ([34e26c9](https://github.com/angular-threejs/angular-three/commit/34e26c90aa49ea120b623488372f6bd817278bbf))

### [1.7.1](https://github.com/angular-threejs/angular-three/compare/1.7.0...1.7.1) (2023-02-15)


### Bug Fixes

* clean up renderer more ([614f698](https://github.com/angular-threejs/angular-three/commit/614f698a7457c156d9d0a9dd601d53b372c131dc))

## [1.7.0](https://github.com/angular-threejs/angular-three/compare/1.6.11...1.7.0) (2023-02-15)


### Features

* add sceneGraphInputs ([cd0d275](https://github.com/angular-threejs/angular-three/commit/cd0d27547d6015a9c50a64ad2ae4ede6e340238f))

### [1.6.11](https://github.com/angular-threejs/angular-three/compare/1.6.10...1.6.11) (2023-02-12)


### Bug Fixes

* run cdr after load assets ([da4a798](https://github.com/angular-threejs/angular-three/commit/da4a798452164a462ad9cec889c7712bf0bd5ed6))

### [1.6.10](https://github.com/angular-threejs/angular-three/compare/1.6.9...1.6.10) (2023-02-12)


### Bug Fixes

* add key$ to select observable from RxStore ([4b87be0](https://github.com/angular-threejs/angular-three/commit/4b87be0247a7125e364f1f2ed85b6bd000e171c5))

### [1.6.9](https://github.com/angular-threejs/angular-three/compare/1.6.8...1.6.9) (2023-02-12)


### Bug Fixes

* revert detect changes in store ([3e36bca](https://github.com/angular-threejs/angular-three/commit/3e36bca1c0203338718f2c550c30a5a91aac9173))

### [1.6.8](https://github.com/angular-threejs/angular-three/compare/1.6.7...1.6.8) (2023-02-12)


### Bug Fixes

* use safeDetectChanges instaed ([b9d5ad4](https://github.com/angular-threejs/angular-three/commit/b9d5ad4dc0be22c84d04b6196e3cdbc8aef8314c))

### [1.6.7](https://github.com/angular-threejs/angular-three/compare/1.6.6...1.6.7) (2023-02-12)


### Bug Fixes

* run detectChanges after set ([7cc72f0](https://github.com/angular-threejs/angular-three/commit/7cc72f0ff4fb6221b4b77b45636e6915c0bedac7))

### [1.6.6](https://github.com/angular-threejs/angular-three/compare/1.6.5...1.6.6) (2023-02-12)


### Bug Fixes

* bind environment injector in runInContext ([aa905ff](https://github.com/angular-threejs/angular-three/commit/aa905ffdba2187bf407c34c3a570edeba9b1821d))
* compound can also be DOM (todo: need a way to exclude compoundPrefix) ([ef25fc5](https://github.com/angular-threejs/angular-three/commit/ef25fc567264e3eb32b793cccd3af12fa2959999))

### [1.6.5](https://github.com/angular-threejs/angular-three/compare/1.6.4...1.6.5) (2023-02-12)


### Bug Fixes

* prevent a THREE child is attached to a parent when it is already attached ([66a98e3](https://github.com/angular-threejs/angular-three/commit/66a98e32b6bd5a0ec1f4e96f3b6fc75987c97b35))

### [1.6.4](https://github.com/angular-threejs/angular-three/compare/1.6.3...1.6.4) (2023-02-09)


### Bug Fixes

* fix lostpointercapture event isn't fired ([b77ae3a](https://github.com/angular-threejs/angular-three/commit/b77ae3a654a54aecbd48d28146f99cf63e741faa))

### [1.6.3](https://github.com/angular-threejs/angular-three/compare/1.6.2...1.6.3) (2023-02-08)


### Bug Fixes

* adjust isDOM logic ([f68e443](https://github.com/angular-threejs/angular-three/commit/f68e443d917dc0eb4ce40bb160260917257850d1))

### [1.6.2](https://github.com/angular-threejs/angular-three/compare/1.6.1...1.6.2) (2023-02-08)


### Bug Fixes

* adjust renderer listen to listen for DOM events if target is root Scene ([46f9206](https://github.com/angular-threejs/angular-three/commit/46f920640f035d9bc1e5bad24b7236d6e9edb968))
* check for instance of Window for isDOM ([4026871](https://github.com/angular-threejs/angular-three/commit/402687116920384d6204f9be1e6994a9ea902024))

### [1.6.1](https://github.com/angular-threejs/angular-three/compare/1.6.0...1.6.1) (2023-02-08)


### Bug Fixes

* use null as fallback value for target CDR in listen ([728f4fe](https://github.com/angular-threejs/angular-three/commit/728f4fe682e59a809abb47936e89597b7d41eb22))

## [1.6.0](https://github.com/angular-threejs/angular-three/compare/1.5.1...1.6.0) (2023-02-08)


### Features

* add createRunInContext ([16d057f](https://github.com/angular-threejs/angular-three/commit/16d057f4ae46464b0ccd0e4d651bfb1d80b45b9a))
* revert *ref ([1c98ed6](https://github.com/angular-threejs/angular-three/commit/1c98ed6675270524641f521f0a5a6c539a43a7d6))

### [1.5.1](https://github.com/angular-threejs/angular-three/compare/1.5.0...1.5.1) (2023-02-08)


### Bug Fixes

* only attach if there's parent ([9728392](https://github.com/angular-threejs/angular-three/commit/9728392da28e2d32c06568231b08a878b1badd9e))

## [1.5.0](https://github.com/angular-threejs/angular-three/compare/1.5.0-beta.0...1.5.0) (2023-02-08)

## [1.5.0-beta.0](https://github.com/angular-threejs/angular-three/compare/1.4.5...1.5.0-beta.0) (2023-02-08)


### Features

* try using ref directive ([2c27890](https://github.com/angular-threejs/angular-three/commit/2c278903485c8ae15c62c7cddb91b6b686fe632e))

### [1.4.5](https://github.com/angular-threejs/angular-three/compare/1.4.4...1.4.5) (2023-02-08)


### Bug Fixes

* check for NgtRendererNode when accessing injectorFactory ([7acf098](https://github.com/angular-threejs/angular-three/commit/7acf09883f1d91f1242db3e8aa646712344dd0c2))

### [1.4.4](https://github.com/angular-threejs/angular-three/compare/1.4.3...1.4.4) (2023-02-08)


### Bug Fixes

* pass target change detector ref to listen ([e648752](https://github.com/angular-threejs/angular-three/commit/e64875210b24c18d1e1253a396e3585ea5132e88))

### [1.4.3](https://github.com/angular-threejs/angular-three/compare/1.4.2...1.4.3) (2023-02-07)


### Bug Fixes

* allow ngtRxStore to trigger change detection on specific state changes ([09361af](https://github.com/angular-threejs/angular-three/commit/09361afb03a79a3ab0f2e8e3ae7b357a3cce6d06))

### [1.4.2](https://github.com/angular-threejs/angular-three/compare/1.4.1...1.4.2) (2023-02-06)


### Bug Fixes

* lift portals up to rendererFactory. all renderers share the same portals collection ([c4fced4](https://github.com/angular-threejs/angular-three/commit/c4fced4cf3ff012e5e976c876c64d6f330e52e87))

### [1.4.1](https://github.com/angular-threejs/angular-three/compare/1.4.0...1.4.1) (2023-02-06)


### Bug Fixes

* attempt to fix isDOM check ([c571734](https://github.com/angular-threejs/angular-three/commit/c571734ba6781e96d7d531ae172c40218bc8f314))


### Documentations

* add link to color grading example ([bfcf948](https://github.com/angular-threejs/angular-three/commit/bfcf948cea20162903e19171456eb13de2269224))

## [1.4.0](https://github.com/angular-threejs/angular-three/compare/1.3.1...1.4.0) (2023-02-06)


### Features

* add safe-detect-changes function ([5dab828](https://github.com/angular-threejs/angular-three/commit/5dab8286822a4d7127f335e044508f8741791c6e))


### Documentations

* add angular-three-soba link ([4ecc970](https://github.com/angular-threejs/angular-three/commit/4ecc97066ad40bc9813de93b59c15775ab00c145))
* add soba storybook external link to nav ([01d5fb4](https://github.com/angular-threejs/angular-three/commit/01d5fb4fca1f19e81e17384643fc13594eb2c1ac))

### [1.3.1](https://github.com/angular-threejs/angular-three/compare/1.3.0...1.3.1) (2023-02-06)


### Bug Fixes

* ensure parent and newChild isn't the same before calling append ([d1da0cd](https://github.com/angular-threejs/angular-three/commit/d1da0cda2e8c2a719588b9aaf32d6e0142a36d0d))


### Documentations

* use external demo site ([766f497](https://github.com/angular-threejs/angular-three/commit/766f49703b1dcbfe34c5a1d065844d02859d6a54))

## [1.3.0](https://github.com/angular-threejs/angular-three/compare/1.2.4...1.3.0) (2023-02-05)


### Features

* up peer dep of threejs to 0.149 ([7d5e144](https://github.com/angular-threejs/angular-three/commit/7d5e144e2d83c394e787f0ce29e4df547b455f83))

### [1.2.4](https://github.com/angular-threejs/angular-three/compare/1.2.3...1.2.4) (2023-02-02)


### Bug Fixes

* expose loop ([b22b903](https://github.com/angular-threejs/angular-three/commit/b22b903db02d7324290e292f20fe0e086dcb4b10))

### [1.2.3](https://github.com/angular-threejs/angular-three/compare/1.2.2...1.2.3) (2023-01-31)


### Bug Fixes

* check target for all DOM nodes instead of just Document object ([043ddfc](https://github.com/angular-threejs/angular-three/commit/043ddfc088b50ba100ce6328360b47a4b68735da))


### Documentations

* clean up camera demo ([4553199](https://github.com/angular-threejs/angular-three/commit/4553199cb75a8968d1a883a52203b068b4d26d94))
* clean up more demos ([728db58](https://github.com/angular-threejs/angular-three/commit/728db58c87bcbfbbe5c93f7a265497b0d8d91dfb))
* remove GUI on destroy (animation spinning) ([1104e27](https://github.com/angular-threejs/angular-three/commit/1104e27851f9bf1dace0647a75dccf4cf6ef2dda))

### [1.2.2](https://github.com/angular-threejs/angular-three/compare/1.2.1...1.2.2) (2023-01-30)


### Bug Fixes

* use Document as ownerDocument for renderer node that does not have ownerDocument yet ([4322bec](https://github.com/angular-threejs/angular-three/commit/4322bec2cde6b1bc9c41a78ed4b64f14b6a13308))
* use RendererFactory2 to inject into NgtRenderer instead of using private api ([4e6470d](https://github.com/angular-threejs/angular-three/commit/4e6470d16335be45c4155c8f3d5be3fa111f2059))


### Documentations

* add animation with ccdiksolver ([eb59ea6](https://github.com/angular-threejs/angular-three/commit/eb59ea6f3b70374ba5f90b18c2874402150b1c2a))
* add cameras demo ([ca3d10d](https://github.com/angular-threejs/angular-three/commit/ca3d10d6e19c4a9b539a9cb35aa4e2ffe65d6f84))
* add legacy to spinning ik ([a69179a](https://github.com/angular-threejs/angular-three/commit/a69179a293d5bae065caf6e601822b6355eb9991))
* clean up skinning ik ([85d089a](https://github.com/angular-threejs/angular-three/commit/85d089a5e99bff24cd04f20218595af85735da0d))
* clean up skinning ik demo more ([d7508c8](https://github.com/angular-threejs/angular-three/commit/d7508c87f48a32a39a578aba74f20d8da3fe7aea))
* clean up spinning ik more ([1dd5064](https://github.com/angular-threejs/angular-three/commit/1dd5064ef54530fba28d9c450c78eb4cae935847))

### [1.2.1](https://github.com/angular-threejs/angular-three/compare/1.2.0...1.2.1) (2023-01-29)


### Bug Fixes

* adjust type of ngtloader ([2e99442](https://github.com/angular-threejs/angular-three/commit/2e994425552f21a3def0bd322f6564b524fbe78e))


### Documentations

* add vertex colors instances ([7eff3e2](https://github.com/angular-threejs/angular-three/commit/7eff3e2282ddbb1de93bb43be8cd5d498fe1cd00))
* add webgl animation keyframes ([fdb6b03](https://github.com/angular-threejs/angular-three/commit/fdb6b0356f17113c36da95dae8917f48ace6de0a))

## [1.2.0](https://github.com/angular-threejs/angular-three/compare/1.1.0...1.2.0) (2023-01-28)


### Features

* adjust three peer dep version ([b7bede3](https://github.com/angular-threejs/angular-three/commit/b7bede3720f93fa852a35e8d4a3b8c3adc09937e))


### Bug Fixes

* adjust the codebase ([c7ace43](https://github.com/angular-threejs/angular-three/commit/c7ace436ad481203a096a6e436050dac3d4b7f4c))
* clean up renderer ([332229c](https://github.com/angular-threejs/angular-three/commit/332229cc48050ac136f1cedc74620dd363ca14ac))

## [1.1.0](https://github.com/angular-threejs/angular-three/compare/1.0.2...1.1.0) (2023-01-25)


### Features

* confirm rawValue to work as attribute binding ([b133670](https://github.com/angular-threejs/angular-three/commit/b13367073a2dc1494b430fb1da6201bf2f02bcdd))

### [1.0.2](https://github.com/angular-threejs/angular-three/compare/1.0.1...1.0.2) (2023-01-24)


### Bug Fixes

* expose tapEffect ([b69f7c2](https://github.com/angular-threejs/angular-three/commit/b69f7c2eccab538fd3d99b97cf0eefb30e32ff28))


### Documentations

* add demo link ([ab10fe0](https://github.com/angular-threejs/angular-three/commit/ab10fe04ca66ff08463a15c10d0f8954b7828226))
* adjust documentations and fill out some TBD that can be filled ([e98b040](https://github.com/angular-threejs/angular-three/commit/e98b040b9fec01076bd6a25f4714e24c5e7a05c9))
* disable eslint on host metadata ([1187a54](https://github.com/angular-threejs/angular-three/commit/1187a54c7eddaf5fdbfde1ca79b844352cf0b073))
* get docs home page in ([dd043f7](https://github.com/angular-threejs/angular-three/commit/dd043f76f94d1ba9b476cdeddc3f11ce69edabb3))

### [1.0.1](https://github.com/angular-threejs/angular-three/compare/1.0.0...1.0.1) (2023-01-24)


### Bug Fixes

* add nrwl/devkit to deps ([df526b2](https://github.com/angular-threejs/angular-three/commit/df526b2cb147a0c5798e2dbbf162eedc95391075))

## [1.0.0](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.11...1.0.0) (2023-01-24)


### Features

* add nx plugin for ng add ([ba85e71](https://github.com/angular-threejs/angular-three/commit/ba85e7100c2c2ff28b8dc529467adb97c6090a15))
* add portal ([baba2d8](https://github.com/angular-threejs/angular-three/commit/baba2d8d5d2e4fc143e2b6612be21b0119f17660))
* expose make ([380a739](https://github.com/angular-threejs/angular-three/commit/380a73907a73377f263c89650dc37959f07738a9))


### Bug Fixes

* adjust how children of portal store gets the portalStore instance ([04fffae](https://github.com/angular-threejs/angular-three/commit/04fffaebcf17f0252bed372f7e238e4daef6e5d6))
* allow prepare to accept a synchronous function to calculate the instance ([cdf0637](https://github.com/angular-threejs/angular-three/commit/cdf0637228b03b4b6dd64e724f55b40c501a0c83))
* dedupe when adding new object to instance local state ([e2fb313](https://github.com/angular-threejs/angular-three/commit/e2fb313f79ba33b0320dd538ad31ed8fce6e05ac))
* primitive element should not dispose underlying object ([a091aca](https://github.com/angular-threejs/angular-three/commit/a091acadb7e3a40d7e522639c97423720665f0db))


### Documentations

* add some advanced topics ([513c9da](https://github.com/angular-threejs/angular-three/commit/513c9dab4ae085d7647a72e623a361d260331b61))
* add view-cube to showcase portal ([3db1aeb](https://github.com/angular-threejs/angular-three/commit/3db1aeb5c9496752a050fa3ed66209da6619d452))
* finish current API ([c8c3079](https://github.com/angular-threejs/angular-three/commit/c8c3079fde314a4638a718dcfa2e77a46209bd61))
* setup documentation for deploy ([8a2e2e5](https://github.com/angular-threejs/angular-three/commit/8a2e2e5cd32f4f8c2d9a5b6d4dc93e02717a1aa0))
* update angular three readme ([6e7e365](https://github.com/angular-threejs/angular-three/commit/6e7e3659df8dd1a92cdb8fc765be998d4f1e1514))

## [1.0.0-beta.11](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.10...1.0.0-beta.11) (2023-01-23)


### Features

* add createAttachFunction for aid with attach input as function ([882f7d9](https://github.com/angular-threejs/angular-three/commit/882f7d9384dd8044fab6b64e4dccadcf1216c40e))


### Documentations

* almost finish custom renderer docs ([d2c329b](https://github.com/angular-threejs/angular-three/commit/d2c329b383375612d2383096d906e329ae5f7e3f))

## [1.0.0-beta.10](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.9...1.0.0-beta.10) (2023-01-22)


### Bug Fixes

* set legacy mode with canvas inputs rather than state.legacy ([10388e5](https://github.com/angular-threejs/angular-three/commit/10388e5ee64ce47ec47f6f987818e4d84619c0d7))

## [1.0.0-beta.9](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.8...1.0.0-beta.9) (2023-01-22)


### Features

* add injectBeforeRender ([57d71b5](https://github.com/angular-threejs/angular-three/commit/57d71b550d36e623c489f29468b2cd5b72a75ff5))


### Bug Fixes

* use a div instead of ngt-canvas-container component ([821fa55](https://github.com/angular-threejs/angular-three/commit/821fa557c5c1b93a5d86447d668aa3dd4b0fae76))


### Documentations

* add Canvas API ([015168f](https://github.com/angular-threejs/angular-three/commit/015168fabe0d84b80d3581e38d9562a2cd0dec92))
* first scene ([54901e7](https://github.com/angular-threejs/angular-three/commit/54901e78c03366805746e7fb36ffd94742bf1077))

## [1.0.0-beta.8](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.7...1.0.0-beta.8) (2023-01-20)


### Bug Fixes

* rename scene input to sceneGraph to differentiate it with THREE Scene ([0ac4b0a](https://github.com/angular-threejs/angular-three/commit/0ac4b0aeece98b3b4ec0e5df3a50dd4e64fdfe95))

## [1.0.0-beta.7](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.6...1.0.0-beta.7) (2023-01-20)


### Features

* add push pipe ([4acad9d](https://github.com/angular-threejs/angular-three/commit/4acad9ddda6c927176ef9554cf32e4f3ebf9de29))

## [1.0.0-beta.6](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.5...1.0.0-beta.6) (2023-01-20)


### Bug Fixes

* adjust GLTF type import in loader so we do not rely on three-stdlib ([d9d3120](https://github.com/angular-threejs/angular-three/commit/d9d3120010592966a4d94710034b35f7c6728834))


### Documentations

* add docusaurus ([939afb3](https://github.com/angular-threejs/angular-three/commit/939afb3278df9aad419a234d9d5397bd2691f95a))
* start working on docs ([3c55437](https://github.com/angular-threejs/angular-three/commit/3c55437de4c79924c0aec22fe0d5b67d9e852037))

## [1.0.0-beta.5](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.4...1.0.0-beta.5) (2023-01-20)


### Bug Fixes

* expose utils "is" ([745c6e3](https://github.com/angular-threejs/angular-three/commit/745c6e303a8dbd19f58091e3e0b3c8bf3ec52d15))

## [1.0.0-beta.4](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.3...1.0.0-beta.4) (2023-01-19)


### Features

* expose more to public API ([e1f3982](https://github.com/angular-threejs/angular-three/commit/e1f3982eeb31b43a89f93f0390ecd1219f8da520))

## [1.0.0-beta.3](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.0...1.0.0-beta.3) (2023-01-19)


### Bug Fixes

* add rxangular state to non peer dependency ([f0fd966](https://github.com/angular-threejs/angular-three/commit/f0fd966361d51b8956043e4c8b45f82eae8761a5))
* root cdr now calls the component ref cdr after itself ([4ba20f4](https://github.com/angular-threejs/angular-three/commit/4ba20f474be27bbe4fb7605cee188aa543ad00f8))

## [1.0.0-beta.1](https://github.com/angular-threejs/angular-three/compare/1.0.0-beta.0...1.0.0-beta.1) (2023-01-19)


### Bug Fixes

* add rxangular state to non peer dependency ([f0fd966](https://github.com/angular-threejs/angular-three/commit/f0fd966361d51b8956043e4c8b45f82eae8761a5))

## 1.0.0-beta.0 (2023-01-19)


### Features

* add args ([50a9814](https://github.com/angular-threejs/angular-three/commit/50a98143f62049b2e5cf99fb104b6495c34e152d))
* add canvas ([9d584c3](https://github.com/angular-threejs/angular-three/commit/9d584c36e98a6f9bf05e12927b38d2ae7c7f7edd))
* add core lib ([a9db86d](https://github.com/angular-threejs/angular-three/commit/a9db86db52aaffd87bb2959b58c10d9f9b38f860))
* add destry injection fn ([1ff55c3](https://github.com/angular-threejs/angular-three/commit/1ff55c3f1cb5dd14660a8649061ebad6a9b59a97))
* add loader ([16a6611](https://github.com/angular-threejs/angular-three/commit/16a6611828bc96664165b2bc9dc4f6b4f5bcb8a4))
* add loop ([52d487c](https://github.com/angular-threejs/angular-three/commit/52d487c0e0fad3224de59e7894b3326ecc80c429))
* add r3f stuffs ([e238e35](https://github.com/angular-threejs/angular-three/commit/e238e35665a4af7b43f62a13f2b2af829a9cfe78))
* add ref ([3e9bf47](https://github.com/angular-threejs/angular-three/commit/3e9bf478b0c181479da7f228b31c54131bcf39e3))
* add renderer ([a8176a5](https://github.com/angular-threejs/angular-three/commit/a8176a50f907b26ecee4a26de719ca557890e352))
* add repeat ([59d3423](https://github.com/angular-threejs/angular-three/commit/59d3423262aa360c616f2fb169754d360db66bc3))
* add rx-state ([a4b62e1](https://github.com/angular-threejs/angular-three/commit/a4b62e175a90b507dd0cb79e3dd7a69802be2a51))
* add store ([ed10862](https://github.com/angular-threejs/angular-three/commit/ed108626569f218e51f91d7750831eaf97aef45d))
* add type ([8cbda45](https://github.com/angular-threejs/angular-three/commit/8cbda450615cc15c6912137353a4b58cb2866fbb))
* finish canvas ([5f3334a](https://github.com/angular-threejs/angular-three/commit/5f3334a3e5316476f14363cbf07fc4d9a50df160))
* finish the renderer ([70f66e8](https://github.com/angular-threejs/angular-three/commit/70f66e888d664473da0dc104eca1d9c585b33db5))


### Documentations

* add demo app ([c774832](https://github.com/angular-threejs/angular-three/commit/c774832f40d857b1acb5ea7adb80a12e3b8d0bc7))