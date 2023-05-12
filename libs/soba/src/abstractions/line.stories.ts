import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata } from '@storybook/angular';
import {
    NgtsCatmullRomLine,
    NgtsCubicBezierLine,
    NgtsLine,
    NgtsQuadraticBezierLine,
} from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import * as THREE from 'three';
import { GeometryUtils } from 'three-stdlib';
import { color, makeStoryObject, number, select, StorybookSetup } from '../setup-canvas';

const points = GeometryUtils.hilbert3D(new THREE.Vector3(0), 5).map((p) => [p.x, p.y, p.z]) as [
    number,
    number,
    number
][];

const colors = new Array(points.length).fill(0).map(() => [Math.random(), Math.random(), Math.random()]) as [
    number,
    number,
    number
][];

const defaultQuadraticBezier = {
    start: [0, 0, 0],
    end: [4, 7, 5],
    segments: 10,
};

const defaultCubicBezier = {
    start: [0, 0, 0],
    end: [10, 0, 10],
    midA: [5, 4, 0],
    midB: [0, 0, 5],
    segments: 10,
};

const catPoints = [
    [0, 0, 0] as [number, number, number],
    [-8, 6, -5] as [number, number, number],
    [-2, 3, 7] as [number, number, number],
    [6, 4.5, 3] as [number, number, number],
    [0.5, 8, -1] as [number, number, number],
];

const defaultCatmullRom = {
    points: catPoints,
    segments: 20,
    tension: 0.5,
    closed: false,
    curveType: 'centripetal',
};

@Component({
    standalone: true,
    template: `
        <ngts-catmull-rom-line
            [points]="points"
            [closed]="closed"
            [curveType]="curveType"
            [tension]="tension"
            [segments]="segments"
            [color]="color"
            [lineWidth]="lineWidth"
            [dashed]="dashed"
        />
        <ngts-orbit-controls [zoomSpeed]="0.5" />
    `,
    imports: [NgtsCatmullRomLine, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class CatmullRomLineStory {
    readonly points = defaultCatmullRom.points;
    @Input() color = 'red';
    @Input() lineWidth = 3;
    @Input() dashed = false;
    @Input() segments = defaultCatmullRom.segments;
    @Input() closed = defaultCatmullRom.closed;
    @Input() curveType = defaultCatmullRom.curveType;
    @Input() tension = defaultCatmullRom.tension;
}

@Component({
    standalone: true,
    template: `
        <ngts-quadratic-bezier-line
            [start]="start"
            [end]="end"
            [midA]="midA"
            [midB]="midB"
            [segments]="segments"
            [color]="color"
            [lineWidth]="lineWidth"
            [dashed]="dashed"
        />
        <ngts-orbit-controls [zoomSpeed]="0.5" />
    `,
    imports: [NgtsQuadraticBezierLine, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class QuadraticBezierLineStory {
    @Input() color = 'red';
    @Input() lineWidth = 3;
    @Input() dashed = false;
    @Input() start = defaultQuadraticBezier.start;
    @Input() end = defaultQuadraticBezier.end;
    @Input() segments = defaultQuadraticBezier.segments;
}

@Component({
    standalone: true,
    template: `
        <ngts-cubic-bezier-line
            [start]="start"
            [end]="end"
            [midA]="midA"
            [midB]="midB"
            [segments]="segments"
            [color]="color"
            [lineWidth]="lineWidth"
            [dashed]="dashed"
        />
        <ngts-orbit-controls [zoomSpeed]="0.5" />
    `,
    imports: [NgtsCubicBezierLine, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class CubicBezierLineStory {
    @Input() color = 'red';
    @Input() lineWidth = 3;
    @Input() dashed = false;
    @Input() start = defaultCubicBezier.start;
    @Input() end = defaultCubicBezier.end;
    @Input() midA = defaultCubicBezier.midA;
    @Input() midB = defaultCubicBezier.midB;
    @Input() segments = defaultCubicBezier.segments;
}

@Component({
    standalone: true,
    template: `
        <ngts-line
            [color]="color"
            [vertexColors]="colors"
            [lineWidth]="lineWidth"
            [dashed]="dashed"
            [points]="points"
        />
        <ngts-orbit-controls [zoomSpeed]="0.5" />
    `,
    imports: [NgtsLine, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class VertexColorsLineStory {
    readonly points = points;
    readonly colors = colors;

    @Input() color = 'red';
    @Input() lineWidth = 3;
    @Input() dashed = false;
}

@Component({
    standalone: true,
    template: `
        <ngts-line [color]="color" [lineWidth]="lineWidth" [dashed]="dashed" [points]="points" />
        <ngts-orbit-controls [zoomSpeed]="0.5" />
    `,
    imports: [NgtsLine, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultLineStory {
    readonly points = points;

    @Input() color = 'red';
    @Input() lineWidth = 3;
    @Input() dashed = false;
}

export default {
    title: 'Abstractions/Line',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

const canvasOptions = { camera: { position: [0, 0, 17] }, controls: false };

export const Default = makeStoryObject(DefaultLineStory, {
    canvasOptions,
    argsOptions: { color: color('red'), dashed: false, lineWidth: number(3, { range: true, max: 10, step: 0.5 }) },
});
export const VertexColors = makeStoryObject(VertexColorsLineStory, {
    canvasOptions,
    argsOptions: { dashed: false, lineWidth: number(3, { range: true, max: 10, step: 0.5 }) },
});
export const CubicBezierLine = makeStoryObject(CubicBezierLineStory, {
    canvasOptions,
    argsOptions: {
        ...defaultCubicBezier,
        color: color('red'),
        dashed: false,
        lineWidth: number(3, { range: true, max: 10, step: 0.5 }),
    },
});
export const QuadraticBezierLine = makeStoryObject(QuadraticBezierLineStory, {
    canvasOptions,
    argsOptions: {
        ...defaultQuadraticBezier,
        color: color('red'),
        dashed: false,
        lineWidth: number(3, { range: true, max: 10, step: 0.5 }),
    },
});
export const CatmullRomLine = makeStoryObject(CatmullRomLineStory, {
    canvasOptions,
    argsOptions: {
        ...defaultCatmullRom,
        color: color('red'),
        dashed: false,
        lineWidth: number(3, { range: true, max: 10, step: 0.5 }),
        curveType: select(defaultCatmullRom.curveType, { options: ['centripetal', 'chordal', 'catmullrom'] }),
    },
});
