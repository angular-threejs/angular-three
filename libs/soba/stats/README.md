# `angular-three-soba/stats`

This secondary entry point provides performance monitoring components for your Three.js scenes.

## Dependencies

```bash
npm install stats-gl
# yarn add stats-gl
# pnpm add stats-gl
```

## NgtsStats

A directive that displays performance statistics (FPS, MS, MB) for the Three.js renderer using stats-gl. It automatically attaches to the canvas and updates every frame.

### Object Input (`NgtsStatsOptions`)

| Property    | Description                                    | Default Value          |
| ----------- | ---------------------------------------------- | ---------------------- |
| `showPanel` | The panel index to display (0=FPS, 1=MS, 2=MB) | `undefined`            |
| `domClass`  | CSS class(es) to apply to the stats element    | `''`                   |
| `parent`    | Parent element to attach the stats panel to    | `null` (document.body) |

Additionally, all properties from the stats-gl `Stats` class are supported.

### Usage

The directive is applied directly to `ngt-canvas` using the `stats` attribute:

```html
<!-- Basic usage -->
<ngt-canvas [stats]="true" />

<!-- With custom options -->
<ngt-canvas [stats]="{ domClass: 'my-stats', showPanel: 0 }" />

<!-- Attached to a custom parent element -->
<div #statsContainer></div>
<ngt-canvas [stats]="{ parent: statsContainer }" />
```

### Panel Types

| Panel | Description                      |
| ----- | -------------------------------- |
| `0`   | FPS - Frames per Second          |
| `1`   | MS - Milliseconds per frame      |
| `2`   | MB - Memory usage (if available) |

### Styling

You can style the stats panel using the `domClass` option:

```css
.my-stats {
	position: absolute !important;
	top: 10px !important;
	left: 10px !important;
}
```

```html
<ngt-canvas [stats]="{ domClass: 'my-stats' }" />
```
