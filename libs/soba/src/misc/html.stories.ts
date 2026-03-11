import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsHTML, NgtsHTMLContentOptions, NgtsHTMLOptions } from 'angular-three-soba/misc';
import { NgtsDetailed } from 'angular-three-soba/performances';
import { ColorRepresentation } from 'three';
import { storyDecorators, storyFunction, storyObject, Turnable } from '../setup-canvas';

@Component({
	selector: 'html-scene',
	template: `
		<ngt-group turnable>
			<ngt-mesh [position]="[3, 6, 4]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color()" wireframe />

				<ngts-html [options]="{ transform: transform() }">
					<div [htmlContent]="{ distanceFactor: 30 }" style="color: white;">
						<h1>First</h1>
					</div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh [position]="[10, 0, 10]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color()" wireframe />

				<ngts-html [options]="{ transform: transform() }">
					<div [htmlContent]="{ distanceFactor: 30 }" style="color: white;">
						<h1>Second</h1>
					</div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh [position]="[-20, 0, -20]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color()" wireframe />

				<ngts-html [options]="{ transform: transform() }">
					<div [htmlContent]="{ distanceFactor: 30 }" style="color: white;">
						<h1>Third</h1>
					</div>
				</ngts-html>
			</ngt-mesh>

			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsHTML, Turnable],
})
class HtmlScene {
	color = input<ColorRepresentation>('hotpink');
	transform = input(false);
}

@Component({
	template: `
		<html-scene color="palegreen" transform>
			<ngts-html [options]="htmlOptions()">
				<div [htmlContent]="htmlContentOptions()">Transform mode</div>
			</ngts-html>
		</html-scene>
	`,
	styles: `
		::ng-deep .transformed-container {
			background: palegreen;
			font-size: 50px;
			padding: 10px 18px;
			border: 2px solid black;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [HtmlScene, NgtsHTML],
})
class HtmlTransformScene {
	htmlOptions = input({} as NgtsHTMLOptions);
	htmlContentOptions = input({} as NgtsHTMLContentOptions);
}

@Component({
	selector: 'html-lod-scene',
	template: `
		<ngts-detailed [distances]="[0, 8, 18]">
			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[2, 4]" />
				<ngt-mesh-basic-material color="hotpink" wireframe />

				<ngts-html [options]="{ position: [2.5, 0, 0] }">
					<div [htmlContent]="{ center: true }" style="color: white; background: rgba(0,0,0,0.5); padding: 4px 8px; white-space: nowrap;">
						High Detail
					</div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material color="orange" wireframe />

				<ngts-html [options]="{ position: [2.5, 0, 0] }">
					<div [htmlContent]="{ center: true }" style="color: white; background: rgba(0,0,0,0.5); padding: 4px 8px; white-space: nowrap;">
						Medium Detail
					</div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[2, 1]" />
				<ngt-mesh-basic-material color="skyblue" wireframe />

				<ngts-html [options]="{ position: [2.5, 0, 0] }">
					<div [htmlContent]="{ center: true }" style="color: white; background: rgba(0,0,0,0.5); padding: 4px 8px; white-space: nowrap;">
						Low Detail
					</div>
				</ngts-html>
			</ngt-mesh>
		</ngts-detailed>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsHTML, NgtsDetailed],
})
class HtmlWithLODScene {}

export default {
	title: 'Misc/HTML',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyFunction(HtmlScene, { camera: { position: [-20, 20, -20] } });
export const WithLOD = storyFunction(HtmlWithLODScene, { camera: { position: [0, 0, 10] } });
export const Transform = storyObject(HtmlTransformScene, {
	camera: { position: [-20, 20, -20] },
	argsOptions: {
		htmlOptions: {
			transform: true,
			position: [5, 15, 0],
		},
		htmlContentOptions: {
			sprite: true,
			distanceFactor: 20,
			containerClass: 'transformed-container',
			containerStyle: {
				background: 'palegreen',
				fontSize: '50px',
				padding: '10px 18px',
				border: '2px solid black',
			} as Partial<CSSStyleDeclaration>,
		},
	},
});
