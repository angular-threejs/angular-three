# Angular Renderer for THREE.js

[![From Vietnam with <3](https://raw.githubusercontent.com/webuild-community/badge/master/svg/love.svg)](https://webuild.community)

Leverage your [Angular](https://angular.io) to build 3D applications with [THREE.js](https://threejs.org)

## Installation

### Angular CLI

```shell
npx ng add angular-three
```

### Nx

```shell
npm i angular-three
npx nx g angular-three:init
```

### Manual

```shell
npm i angular-three three
```

```shell
npm i -D @types/three
```

-   Adjust `tsconfig.json` (or `tsconfig.base.json`) to include `skipTypeCheck: false`

> Typically, we'd want to keep `three` and `@types/three` on the same minor version. Eg: `0.147`, `0.148` etc..

## Type

### VSCode

-   If you use `ng add` or `nx generate` command, this is setup for you.
-   If you install `angular-three` manually, you can do the following steps to enable typings
    -   Open `.vscode/settings.json`, or create one if you do not have it
    -   Add `html.customData` property with the value of `["./node_modules/angular-three/metadata.json"]`. If `html.customData` exists, simply add `"./node_modules/angular-three/metadata.json"` to the array

### WebStorm/IntelliJ

-   You **should not** need to do anything here but if things do not work, you can add `web-types` property to `package.json` with the value of `"./node_modules/angular-three/web-types.json"`

### NeoVim

Setup will vary depending on your current NeoVim configuration. However, I'd expect the **required** steps to be the same

-   `neovim/nvim-lspconfig` needs to be configured for `html` LSP
-   `init_options.dataPaths` needs to include the path to `node_modules/angular-three/metadata.json`
-   Setup a `html/customDataContent` handler (`handlers = {["html/customDataContent"] = function() ... end}` for Lua syntax)
    and return the content of the `init_options.dataPaths`

Here's an example setup for [LazyVim](https://www.lazyvim.org/)

```lua
return {
  {
    "neovim/nvim-lspconfig",
    ---@class PluginLspOpts
    opts = {
      ---@type table<string, fun(server:string, opts:_.lspconfig.options):boolean?>
      setup = {
        html = function(_, opts)
          opts.init_options = {
            dataPaths = {
              vim.fn.getcwd() .. "/node_modules/angular-three/metadata.json",
            },
            configurationSection = { "html", "css", "javascript" },
            embeddedLanguages = {
              css = true,
              javascript = true,
            },
            provideFormatter = true,
          }

          opts.handlers = {
            ["html/customDataContent"] = function(err, result, ctx, config)
              local function exists(name)
                if type(name) ~= "string" then
                  return false
                end
                return os.execute("test -e " .. name)
              end

              if not vim.tbl_isempty(result) and #result == 1 then
                if not exists(result[1]) then
                  return ""
                end
                local content = vim.fn.join(vim.fn.readfile(result[1]), "\n")
                return content
              end
              return ""
            end,
          }

          return false
        end,
      },
    },
  },
}
```

## Documentations

Read more about Angular Three usages in [Documentations](https://angular-three-backupjs.netlify.app)

## Simple usage

1. Create a `Scene` component as a Standalone Component

```ts
import { extend } from 'angular-three';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';

extend({ Mesh, BoxGeometry, MeshBasicMaterial });

@Component({
    standalone: true,
    template: `
        <ngt-mesh>
            <ngt-box-geometry />
            <ngt-mesh-basic-material color="darkred" />
        </ngt-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {}
```

-   `extend` will add the THREE entities to `angular-three` catalogue which allows the renderer to recognize the custom tags: `ngt-mesh`, `ngt-box-geometry` etc..
-   Custom Element tags follow this rule: `ngt-` + THREE classes in **kebab-case**. `Mesh` -> `ngt-mesh`
-   `schemas: [CUSTOM_ELEMENTS_SCHEMA]` allows us to use custom tags on the template. This is Angular's limitation at the moment

2. Render `<ngt-canvas>` component, use `Scene` component above to pass into `[sceneGraph]` input on `<ngt-canvas>`

```html
<ngt-canvas [sceneGraph]="Scene" />
```

-   `ngt-canvas` creates the basic building blocks of THREE.js: a default `WebGLRenderer`, a default `Scene`, and a default `PerspectiveCamera`

## Contributions

Contributions are welcomed
